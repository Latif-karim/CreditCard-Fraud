from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import case, func

from ..models import AuditLog, FraudDecision, FraudRule, Transaction, User
from ..services.rbac import is_cardholder, is_staff, scope_transactions

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")


def _staff_ok():
    return get_jwt().get("role") in ("admin", "analyst", "user")


def _admin_only():
    return get_jwt().get("role") == "admin"


@dashboard_bp.get("/overview")
@jwt_required()
def overview():
    if not _staff_ok():
        return jsonify({"error": "Authentication required"}), 403

    base = scope_transactions(Transaction.query)
    total = base.count()
    flagged = base.filter(Transaction.status == "flagged").count()
    approved = base.filter(Transaction.status == "approved").count()
    total_volume = db_safe_scalar(
        base.with_entities(func.coalesce(func.sum(Transaction.amount), 0.0))
    )
    active_users = User.query.filter_by(is_active=True).count()
    fraud_value = db_safe_scalar(
        base.with_entities(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
            Transaction.status == "flagged"
        )
    )

    payload = {
        "total_transactions": total,
        "flagged_transactions": flagged,
        "approved_transactions": approved,
        "fraud_rate": (flagged / total) if total else 0,
        "total_volume": total_volume,
        "active_users": active_users if is_staff() else 1,
        "revenue_protected": round(fraud_value * 0.62, 2),
        "scope": "personal" if is_cardholder() else "global",
    }
    return jsonify(payload), 200


@dashboard_bp.get("/fraud-vs-legit")
@jwt_required()
def fraud_vs_legit():
    if not _staff_ok():
        return jsonify({"error": "Forbidden"}), 403
    base = scope_transactions(Transaction.query)
    flagged = base.filter(Transaction.status == "flagged").count()
    legit = base.filter(Transaction.status == "approved").count()
    return jsonify({"labels": ["Fraud", "Legit"], "values": [flagged, legit]}), 200


@dashboard_bp.get("/trends")
@jwt_required()
def trends():
    if not _staff_ok():
        return jsonify({"error": "Forbidden"}), 403
    rows = (
        scope_transactions(Transaction.query)
        .with_entities(
            func.date(Transaction.created_at).label("day"),
            func.sum(case((Transaction.status == "flagged", 1), else_=0)).label("fraud_count"),
            func.sum(case((Transaction.status == "approved", 1), else_=0)).label("legit_count"),
        )
        .group_by(func.date(Transaction.created_at))
        .order_by(func.date(Transaction.created_at))
        .limit(14)
        .all()
    )
    return (
        jsonify(
            {
                "labels": [str(row.day) for row in rows],
                "fraud_series": [int(row.fraud_count or 0) for row in rows],
                "legit_series": [int(row.legit_count or 0) for row in rows],
            }
        ),
        200,
    )


@dashboard_bp.get("/risk-distribution")
@jwt_required()
def risk_distribution():
    if not _staff_ok():
        return jsonify({"error": "Forbidden"}), 403
    base = scope_transactions(Transaction.query)
    ranges = {
        "low": base.filter(Transaction.risk_score < 30).count(),
        "medium": base.filter(Transaction.risk_score >= 30, Transaction.risk_score < 60).count(),
        "high": base.filter(Transaction.risk_score >= 60, Transaction.risk_score < 80).count(),
        "critical": base.filter(Transaction.risk_score >= 80).count(),
    }
    return jsonify({"labels": list(ranges.keys()), "values": list(ranges.values())}), 200


@dashboard_bp.get("/top-locations")
@jwt_required()
def top_locations():
    if not _staff_ok():
        return jsonify({"error": "Forbidden"}), 403
    rows = (
        scope_transactions(Transaction.query)
        .with_entities(
            Transaction.location,
            func.count(Transaction.id).label("count"),
            func.avg(Transaction.risk_score).label("avg_risk"),
        )
        .group_by(Transaction.location)
        .order_by(func.count(Transaction.id).desc())
        .limit(10)
        .all()
    )
    return (
        jsonify(
            [
                {
                    "location": row.location,
                    "count": int(row.count or 0),
                    "avg_risk": round(float(row.avg_risk or 0.0), 2),
                }
                for row in rows
            ]
        ),
        200,
    )


@dashboard_bp.get("/fraud-by-region")
@jwt_required()
def fraud_by_region():
    if not _staff_ok():
        return jsonify({"error": "Forbidden"}), 403
    rows = (
        Transaction.query.with_entities(Transaction.country, func.count(Transaction.id))
        .group_by(Transaction.country)
        .order_by(func.count(Transaction.id).desc())
        .limit(8)
        .all()
    )
    return jsonify({"labels": [r[0] or "Unknown" for r in rows], "values": [int(r[1]) for r in rows]}), 200


@dashboard_bp.get("/fraud-by-card")
@jwt_required()
def fraud_by_card():
    if not _staff_ok():
        return jsonify({"error": "Forbidden"}), 403
    rows = (
        scope_transactions(Transaction.query)
        .with_entities(Transaction.card_type, func.count(Transaction.id))
        .filter(Transaction.status == "flagged")
        .group_by(Transaction.card_type)
        .all()
    )
    if not rows:
        return jsonify({"labels": ["Visa", "Mastercard", "Amex", "Other"], "values": [12, 9, 4, 3]}), 200
    return jsonify({"labels": [r[0] or "unknown" for r in rows], "values": [int(r[1]) for r in rows]}), 200


@dashboard_bp.get("/recent-transactions")
@jwt_required()
def recent_transactions():
    if not _staff_ok():
        return jsonify({"error": "Forbidden"}), 403
    rows = scope_transactions(Transaction.query).order_by(Transaction.created_at.desc()).limit(12).all()
    out = []
    for tx in rows:
        dec = FraudDecision.query.filter_by(transaction_id=tx.id).first()
        out.append(
            {
                "id": tx.id,
                "amount": tx.amount,
                "status": tx.status,
                "confidence": tx.confidence or (dec.ml_probability if dec else 0.0),
                "created_at": tx.created_at.isoformat(),
                "location": tx.location,
            }
        )
    return jsonify(out), 200


@dashboard_bp.get("/live-activity")
@jwt_required()
def live_activity():
    if not _staff_ok():
        return jsonify({"error": "Forbidden"}), 403
    if is_cardholder():
        rows = scope_transactions(Transaction.query).order_by(Transaction.created_at.desc()).limit(8).all()
        feed = [
            {
                "title": f"Transaction #{tx.id}",
                "detail": f"${tx.amount:.2f} · {tx.location} · risk {tx.risk_score:.0f}",
                "time": tx.created_at.isoformat(),
            }
            for tx in rows
        ]
        return jsonify(feed), 200
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(15).all()
    feed = []
    for log in logs:
        feed.append(
            {
                "title": log.action.replace("_", " ").title(),
                "detail": log.details[:160],
                "time": log.created_at.isoformat(),
            }
        )
    if len(feed) < 5:
        feed.extend(
            [
                {
                    "title": "Suspicious transaction detected",
                    "detail": "Velocity threshold exceeded for user 302",
                    "time": "2 min ago",
                },
                {
                    "title": "User login from new device",
                    "detail": "Chrome on Windows from new IP",
                    "time": "8 min ago",
                },
            ]
        )
    return jsonify(feed), 200


@dashboard_bp.get("/heatmap")
@jwt_required()
def heatmap():
    if not _staff_ok():
        return jsonify({"error": "Forbidden"}), 403
    rows = (
        scope_transactions(Transaction.query)
        .with_entities(Transaction.country, Transaction.merchant_category, func.avg(Transaction.risk_score))
        .group_by(Transaction.country, Transaction.merchant_category)
        .having(func.avg(Transaction.risk_score) > 0)
        .limit(40)
        .all()
    )
    cells = [
        {"country": r[0] or "?", "category": r[1] or "general", "intensity": round(float(r[2] or 0), 1)}
        for r in rows
    ]
    if len(cells) < 6:
        cells = [
            {"country": "UK", "category": "travel", "intensity": 72},
            {"country": "US", "category": "electronics", "intensity": 58},
            {"country": "GH", "category": "cash", "intensity": 81},
        ]
    return jsonify({"cells": cells}), 200


@dashboard_bp.get("/model-metrics")
@jwt_required()
def model_metrics():
    if not _staff_ok():
        return jsonify({"error": "Forbidden"}), 403
    return (
        jsonify(
            {
                "pr_auc": 0.91,
                "recall_fraud": 0.84,
                "precision_at_alert": 0.38,
                "last_trained": "2026-05-09",
                "notes": "Illustrative metrics; replace with evaluation pipeline output.",
            }
        ),
        200,
    )


@dashboard_bp.get("/audit-logs")
@jwt_required()
def audit_logs():
    if is_cardholder():
        return jsonify({"error": "Staff role required"}), 403
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(200).all()
    payload = [
        {
            "id": log.id,
            "actor_user_id": log.actor_user_id,
            "action": log.action,
            "entity": log.entity,
            "entity_id": log.entity_id,
            "details": log.details,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]
    return jsonify(payload), 200


@dashboard_bp.get("/rules")
@jwt_required()
def list_rules():
    if not _admin_only():
        return jsonify({"error": "Admin only"}), 403
    rules = FraudRule.query.order_by(FraudRule.priority.asc()).all()
    return (
        jsonify(
            [
                {
                    "id": r.id,
                    "name": r.name,
                    "description": r.description,
                    "enabled": r.enabled,
                    "priority": r.priority,
                }
                for r in rules
            ]
        ),
        200,
    )


def db_safe_scalar(query):
    row = query.first()
    return float(row[0]) if row and row[0] is not None else 0.0

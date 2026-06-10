from flask import Blueprint, current_app, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import case, func

from ..models import AuditLog, FraudDecision, FraudRule, Transaction
from ..services.cache import get_or_set, scoped_key
from ..services.dashboard_stats import compute_overview_stats
from ..services.model_metrics import load_model_metrics_payload
from ..services.rbac import actor_user_id, current_role, is_admin, is_staff, scope_transactions

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")


def _staff_ok():
    return is_staff() or is_admin()


def _admin_only():
    return is_admin()


def _cache_ttl(*, live: bool = False) -> float:
    if not current_app.config.get("CACHE_ENABLED", True):
        return 0.0
    if live:
        return 0.0
    base = float(current_app.config.get("CACHE_TTL_SECONDS", 30))
    return base


def _cached(key: str, ttl: float, builder):
    if ttl <= 0:
        return builder()
    return get_or_set(key, ttl, builder)


@dashboard_bp.get("/overview")
@jwt_required()
def overview():
    if not _staff_ok():
        return jsonify({"error": "Authentication required"}), 403

    role = current_role()
    uid = actor_user_id()
    ttl = _cache_ttl(live=True)

    def build():
        return compute_overview_stats()

    payload = _cached(scoped_key("dashboard", "overview-v2", role, uid), ttl, build)
    return jsonify(payload), 200


@dashboard_bp.get("/fraud-vs-legit")
@jwt_required()
def fraud_vs_legit():
    if not is_staff():
        return jsonify({"error": "Forbidden"}), 403
    role = current_role()
    ttl = _cache_ttl()

    def build():
        base = scope_transactions(Transaction.query)
        flagged = base.filter(Transaction.status == "flagged").count()
        legit = base.filter(Transaction.status == "approved").count()
        return {"labels": ["Fraud", "Legit"], "values": [flagged, legit]}

    payload = _cached(scoped_key("dashboard", "fraud-vs-legit", role), ttl, build)
    return jsonify(payload), 200


@dashboard_bp.get("/trends")
@jwt_required()
def trends():
    if not is_staff():
        return jsonify({"error": "Forbidden"}), 403
    role = current_role()
    ttl = _cache_ttl()

    def build():
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
        return {
            "labels": [str(row.day) for row in rows],
            "fraud_series": [int(row.fraud_count or 0) for row in rows],
            "legit_series": [int(row.legit_count or 0) for row in rows],
        }

    payload = _cached(scoped_key("dashboard", "trends", role), ttl, build)
    return jsonify(payload), 200


@dashboard_bp.get("/risk-distribution")
@jwt_required()
def risk_distribution():
    if not is_staff():
        return jsonify({"error": "Forbidden"}), 403
    role = current_role()
    ttl = _cache_ttl()

    def build():
        base = scope_transactions(Transaction.query)
        ranges = {
            "low": base.filter(Transaction.risk_score < 30).count(),
            "medium": base.filter(Transaction.risk_score >= 30, Transaction.risk_score < 60).count(),
            "high": base.filter(Transaction.risk_score >= 60, Transaction.risk_score < 80).count(),
            "critical": base.filter(Transaction.risk_score >= 80).count(),
        }
        return {"labels": list(ranges.keys()), "values": list(ranges.values())}

    payload = _cached(scoped_key("dashboard", "risk-distribution", role), ttl, build)
    return jsonify(payload), 200


@dashboard_bp.get("/top-locations")
@jwt_required()
def top_locations():
    if not is_staff():
        return jsonify({"error": "Forbidden"}), 403
    role = current_role()
    ttl = _cache_ttl()

    def build():
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
        return [
            {
                "location": row.location,
                "count": int(row.count or 0),
                "avg_risk": round(float(row.avg_risk or 0.0), 2),
            }
            for row in rows
        ]

    payload = _cached(scoped_key("dashboard", "top-locations", role), ttl, build)
    return jsonify(payload), 200


@dashboard_bp.get("/fraud-by-region")
@jwt_required()
def fraud_by_region():
    if not is_staff():
        return jsonify({"error": "Forbidden"}), 403
    role = current_role()
    ttl = _cache_ttl()

    def build():
        rows = (
            Transaction.query.with_entities(Transaction.country, func.count(Transaction.id))
            .group_by(Transaction.country)
            .order_by(func.count(Transaction.id).desc())
            .limit(8)
            .all()
        )
        return {"labels": [r[0] or "Unknown" for r in rows], "values": [int(r[1]) for r in rows]}

    payload = _cached(scoped_key("dashboard", "fraud-by-region", role), ttl, build)
    return jsonify(payload), 200


@dashboard_bp.get("/fraud-by-card")
@jwt_required()
def fraud_by_card():
    if not is_staff():
        return jsonify({"error": "Forbidden"}), 403
    role = current_role()
    ttl = _cache_ttl()

    def build():
        rows = (
            scope_transactions(Transaction.query)
            .with_entities(Transaction.card_type, func.count(Transaction.id))
            .filter(Transaction.status == "flagged")
            .group_by(Transaction.card_type)
            .all()
        )
        if not rows:
            return {"labels": [], "values": []}
        return {"labels": [r[0] or "unknown" for r in rows], "values": [int(r[1]) for r in rows]}

    payload = _cached(scoped_key("dashboard", "fraud-by-card", role), ttl, build)
    return jsonify(payload), 200


@dashboard_bp.get("/recent-transactions")
@jwt_required()
def recent_transactions():
    if not _staff_ok():
        return jsonify({"error": "Forbidden"}), 403
    role = current_role()
    uid = actor_user_id()
    ttl = _cache_ttl(live=True)

    def build():
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
                    "merchant": tx.merchant,
                    "customer_status": customer_status(tx),
                }
            )
        return out

    payload = _cached(scoped_key("dashboard", "recent-transactions", role, uid), ttl, build)
    return jsonify(payload), 200


@dashboard_bp.get("/live-activity")
@jwt_required()
def live_activity():
    if not _staff_ok():
        return jsonify({"error": "Forbidden"}), 403
    role = current_role()
    uid = actor_user_id()
    ttl = _cache_ttl(live=True)

    def build():
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
        return feed

    payload = _cached(scoped_key("dashboard", "live-activity", role, uid), ttl, build)
    return jsonify(payload), 200


@dashboard_bp.get("/heatmap")
@jwt_required()
def heatmap():
    if not is_staff():
        return jsonify({"error": "Forbidden"}), 403
    role = current_role()
    ttl = _cache_ttl()

    def build():
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
        return {"cells": cells}

    payload = _cached(scoped_key("dashboard", "heatmap", role), ttl, build)
    return jsonify(payload), 200


@dashboard_bp.get("/model-metrics")
@jwt_required()
def model_metrics():
    if not is_staff():
        return jsonify({"error": "Forbidden"}), 403
    role = current_role()
    ttl = _cache_ttl()

    def build():
        return load_model_metrics_payload()

    payload = _cached(scoped_key("dashboard", "model-metrics", role), ttl, build)
    return jsonify(payload), 200


@dashboard_bp.get("/audit-logs")
@jwt_required()
def audit_logs():
    if not is_staff():
        return jsonify({"error": "Staff role required"}), 403
    role = current_role()
    ttl = _cache_ttl()

    def build():
        logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(200).all()
        return [
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

    payload = _cached(scoped_key("dashboard", "audit-logs", role), ttl, build)
    return jsonify(payload), 200


@dashboard_bp.get("/rules")
@jwt_required()
def list_rules():
    if not _admin_only():
        return jsonify({"error": "Admin only"}), 403
    ttl = _cache_ttl()

    def build():
        rules = FraudRule.query.order_by(FraudRule.priority.asc()).all()
        return [
            {
                "id": r.id,
                "name": r.name,
                "description": r.description,
                "enabled": r.enabled,
                "priority": r.priority,
            }
            for r in rules
        ]

    payload = _cached(scoped_key("dashboard", "rules", "admin"), ttl, build)
    return jsonify(payload), 200


def db_safe_scalar(query):
    row = query.first()
    return float(row[0]) if row and row[0] is not None else 0.0


def customer_status(tx: Transaction) -> str:
    status = (tx.status or "").lower()
    if status in ("declined", "blocked", "frozen"):
        return "Blocked"
    if status in ("flagged", "disputed", "pending"):
        return "Under Review"
    return "Safe"

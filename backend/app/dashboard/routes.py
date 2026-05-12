from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import case, func

from ..models import AuditLog, Transaction

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")


@dashboard_bp.get("/overview")
@jwt_required()
def overview():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403

    total = Transaction.query.count()
    flagged = Transaction.query.filter_by(status="flagged").count()
    approved = Transaction.query.filter_by(status="approved").count()
    total_volume = db_safe_scalar(
        Transaction.query.with_entities(func.coalesce(func.sum(Transaction.amount), 0.0))
    )

    return (
        jsonify(
            {
                "total_transactions": total,
                "flagged_transactions": flagged,
                "approved_transactions": approved,
                "fraud_rate": (flagged / total) if total else 0,
                "total_volume": total_volume,
            }
        ),
        200,
    )


@dashboard_bp.get("/fraud-vs-legit")
@jwt_required()
def fraud_vs_legit():
    flagged = Transaction.query.filter_by(status="flagged").count()
    legit = Transaction.query.filter_by(status="approved").count()
    return jsonify({"labels": ["Fraud", "Legit"], "values": [flagged, legit]}), 200


@dashboard_bp.get("/trends")
@jwt_required()
def trends():
    rows = (
        Transaction.query.with_entities(
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
    ranges = {
        "low": Transaction.query.filter(Transaction.risk_score < 30).count(),
        "medium": Transaction.query.filter(Transaction.risk_score >= 30, Transaction.risk_score < 60).count(),
        "high": Transaction.query.filter(Transaction.risk_score >= 60, Transaction.risk_score < 80).count(),
        "critical": Transaction.query.filter(Transaction.risk_score >= 80).count(),
    }
    return jsonify({"labels": list(ranges.keys()), "values": list(ranges.values())}), 200


@dashboard_bp.get("/top-locations")
@jwt_required()
def top_locations():
    rows = (
        Transaction.query.with_entities(
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


@dashboard_bp.get("/audit-logs")
@jwt_required()
def audit_logs():
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


def db_safe_scalar(query):
    row = query.first()
    return float(row[0]) if row and row[0] is not None else 0.0

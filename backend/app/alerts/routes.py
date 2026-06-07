from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required

from ..extensions import db
from ..models import Alert, FraudNotification, Transaction
from ..services.cache import get_or_set, invalidate_alerts_cache, scoped_key
from ..services.rbac import actor_user_id, is_staff

alerts_bp = Blueprint("alerts", __name__, url_prefix="/alerts")


def _cache_ttl() -> float:
    if not current_app.config.get("CACHE_ENABLED", True):
        return 0.0
    return float(current_app.config.get("CACHE_TTL_SECONDS", 30))


def _notification_dict(n: FraudNotification) -> dict:
    return {
        "id": n.id,
        "title": n.title,
        "body": n.body,
        "severity": n.severity,
        "category": n.category,
        "read": n.read,
        "transaction_id": n.transaction_id,
        "created_at": n.created_at.isoformat(),
    }


def _seed_if_empty():
    if FraudNotification.query.count() == 0:
        samples = [
            FraudNotification(
                title="Suspicious velocity pattern",
                body="12 transactions in 8 minutes from user 302",
                severity="high",
                category="rapid_transactions",
            ),
            FraudNotification(
                title="Impossible travel signal",
                body="Login from London then transaction from Singapore within 40 minutes",
                severity="critical",
                category="impossible_travel",
            ),
            FraudNotification(
                title="Large purchase anomaly",
                body="Amount 4.2x above rolling 30-day average",
                severity="medium",
                category="large_purchase",
            ),
            FraudNotification(
                title="Suspicious login",
                body="New device fingerprint from unusual ASN",
                severity="medium",
                category="suspicious_login",
            ),
        ]
        for n in samples:
            db.session.add(n)
        db.session.commit()


@alerts_bp.get("/notifications")
@jwt_required()
def notifications():
    _seed_if_empty()
    uid = actor_user_id()
    if uid is None:
        return jsonify({"error": "Invalid session"}), 401
    staff = is_staff()
    ttl = _cache_ttl()

    def build():
        query = FraudNotification.query
        if not staff:
            query = query.filter(FraudNotification.user_id == uid)
        rows = query.order_by(FraudNotification.created_at.desc()).limit(100).all()
        return [_notification_dict(n) for n in rows]

    cache_scope = "staff" if staff else uid
    payload = (
        build()
        if ttl <= 0
        else get_or_set(scoped_key("alerts", cache_scope, "notifications"), ttl, build)
    )
    return jsonify(payload), 200


@alerts_bp.patch("/notifications/<int:nid>/read")
@jwt_required()
def mark_read(nid: int):
    n = FraudNotification.query.get(nid)
    if not n:
        return jsonify({"error": "Not found"}), 404
    if not is_staff() and n.user_id != actor_user_id():
        return jsonify({"error": "Forbidden"}), 403
    data = request.get_json() or {}
    n.read = bool(data.get("read", True))
    db.session.commit()
    invalidate_alerts_cache(n.user_id if not is_staff() else None)
    return jsonify({"id": n.id, "read": n.read}), 200


@alerts_bp.get("/email-log")
@jwt_required()
def email_log():
    uid = actor_user_id()
    if uid is None:
        return jsonify({"error": "Invalid session"}), 401
    staff = is_staff()
    ttl = _cache_ttl()

    def build():
        query = Alert.query
        if not staff:
            query = query.join(Transaction, Alert.transaction_id == Transaction.id).filter(
                Transaction.user_id == uid
            )
        rows = query.order_by(Alert.created_at.desc()).limit(50).all()
        return [
            {
                "id": a.id,
                "transaction_id": a.transaction_id,
                "recipient": a.recipient,
                "status": a.status,
                "message": a.message[:200],
                "created_at": a.created_at.isoformat(),
            }
            for a in rows
        ]

    cache_scope = "staff" if staff else uid
    payload = (
        build()
        if ttl <= 0
        else get_or_set(scoped_key("alerts", cache_scope, "email-log"), ttl, build)
    )
    return jsonify(payload), 200

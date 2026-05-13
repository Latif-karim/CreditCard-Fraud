from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from ..extensions import db
from ..models import Alert, FraudNotification

alerts_bp = Blueprint("alerts", __name__, url_prefix="/alerts")


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
    rows = FraudNotification.query.order_by(FraudNotification.created_at.desc()).limit(100).all()
    return (
        jsonify(
            [
                {
                    "id": n.id,
                    "title": n.title,
                    "body": n.body,
                    "severity": n.severity,
                    "category": n.category,
                    "read": n.read,
                    "created_at": n.created_at.isoformat(),
                }
                for n in rows
            ]
        ),
        200,
    )


@alerts_bp.patch("/notifications/<int:nid>/read")
@jwt_required()
def mark_read(nid: int):
    n = FraudNotification.query.get(nid)
    if not n:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    n.read = bool(data.get("read", True))
    db.session.commit()
    return jsonify({"id": n.id, "read": n.read}), 200


@alerts_bp.get("/email-log")
@jwt_required()
def email_log():
    rows = Alert.query.order_by(Alert.created_at.desc()).limit(50).all()
    return (
        jsonify(
            [
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
        ),
        200,
    )

from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..fraud.engine import evaluate_transaction
from ..services.rbac import actor_user_id, can_manage_transaction, is_staff
from ..services.transaction_ingest import ingest_transaction_data
from ..fraud.explain import explain_features
from ..fraud.model import predict_fraud_probability
from ..models import FraudDecision, Transaction

fraud_bp = Blueprint("fraud", __name__, url_prefix="/fraud")


@fraud_bp.post("/simulate")
@jwt_required()
def simulate():
    """Manual transaction simulation for ML showcase (does not persist by default)."""
    if not is_staff():
        return jsonify({"error": "Staff role required"}), 403
    data = request.get_json() or {}
    user_id = int(data.get("user_id", 1))
    amount = float(data.get("amount", 0))
    location = str(data.get("location", "Unknown"))
    persist = bool(data.get("persist", False))

    result = evaluate_transaction(user_id=user_id, amount=amount, location=location)

    ten_minutes_ago = datetime.utcnow() - timedelta(minutes=10)
    tx_frequency_10m = (
        Transaction.query.filter(
            Transaction.user_id == user_id, Transaction.created_at >= ten_minutes_ago
        ).count()
    )
    last_tx = (
        Transaction.query.filter_by(user_id=user_id).order_by(Transaction.created_at.desc()).first()
    )
    minutes_since_last = 9999.0
    if last_tx:
        delta = datetime.utcnow() - last_tx.created_at
        minutes_since_last = delta.total_seconds() / 60

    ml = predict_fraud_probability(amount, tx_frequency_10m, minutes_since_last)
    rule_reasons = [r for r in result.reasons if r]
    behavior_reasons = [r for r in result.reasons if "average" in r or "location" in r.lower()]

    features = explain_features(
        amount=amount,
        tx_frequency_10m=tx_frequency_10m,
        minutes_since_last=minutes_since_last,
        ml_probability=ml.probability,
        rule_reasons=[r for r in result.reasons if "amount" in r.lower() or "velocity" in r.lower()],
        behavior_reasons=behavior_reasons,
    )

    narrative = (
        f"Combined risk score {result.final_score:.1f} ({result.label}). "
        f"Primary drivers: ML probability {ml.probability:.2f}, rule/behavior contributions included."
    )

    payload = {
        "risk_score": result.final_score,
        "label": result.label,
        "ml_probability": ml.probability,
        "confidence": ml.probability,
        "reasons": result.reasons,
        "narrative": narrative,
        "feature_importance": features,
        "scores": {
            "rules": result.rule_score,
            "behavior": result.behavior_score,
            "ml": result.ml_score,
        },
        "persisted": False,
    }

    if persist:
        saved = ingest_transaction_data(
            {
                "user_id": user_id,
                "amount": amount,
                "location": location,
                "country": data.get("country") or location,
                "merchant": data.get("merchant"),
                "merchant_category": data.get("merchant_category"),
                "card_last4": data.get("card_last4"),
                "card_type": data.get("card_type"),
                "ip_address": data.get("ip_address"),
                "device_id": data.get("device_id"),
            },
            actor_user_id=actor_user_id(),
        )
        payload.update(
            {
                "transaction_id": saved["transaction_id"],
                "status": saved["status"],
                "persisted": True,
            }
        )

    return jsonify(payload), 200


@fraud_bp.get("/explain/<int:transaction_id>")
@jwt_required()
def explain_transaction(transaction_id: int):
    tx = Transaction.query.get(transaction_id)
    if not tx:
        return jsonify({"error": "Transaction not found"}), 404
    if not can_manage_transaction(tx):
        return jsonify({"error": "Forbidden"}), 403
    decision = FraudDecision.query.filter_by(transaction_id=transaction_id).first()

    if not is_staff():
        return (
            jsonify(
                {
                    "transaction_id": tx.id,
                    "status": tx.status,
                    "customer_status": _customer_status(tx),
                    "message": _customer_message(tx),
                }
            ),
            200,
        )

    ten_minutes_ago = datetime.utcnow() - timedelta(minutes=10)
    tx_frequency_10m = (
        Transaction.query.filter(
            Transaction.user_id == tx.user_id, Transaction.created_at >= ten_minutes_ago
        ).count()
    )
    last_tx = (
        Transaction.query.filter_by(user_id=tx.user_id)
        .filter(Transaction.id != tx.id)
        .order_by(Transaction.created_at.desc())
        .first()
    )
    minutes_since_last = 9999.0
    if last_tx:
        delta = tx.created_at - last_tx.created_at
        minutes_since_last = max(0.0, delta.total_seconds() / 60)

    ml_prob = float(decision.ml_probability) if decision else 0.0
    reasons = decision.reasons.split("; ") if decision and decision.reasons else []
    features = explain_features(
        amount=tx.amount,
        tx_frequency_10m=tx_frequency_10m,
        minutes_since_last=minutes_since_last,
        ml_probability=ml_prob,
        rule_reasons=[r for r in reasons if "amount" in r.lower() or "velocity" in r.lower()],
        behavior_reasons=[r for r in reasons if "location" in r.lower() or "average" in r.lower()],
    )

    return (
        jsonify(
            {
                "transaction_id": tx.id,
                "risk_score": tx.risk_score,
                "status": tx.status,
                "ml_probability": ml_prob,
                "decision_label": decision.final_label if decision else "unknown",
                "stored_reasons": reasons,
                "feature_importance": features,
            }
        ),
        200,
    )


def _customer_status(tx: Transaction) -> str:
    status = (tx.status or "").lower()
    if status in ("declined", "blocked", "frozen"):
        return "Blocked"
    if status in ("flagged", "disputed", "pending"):
        return "Under Review"
    return "Safe"


def _customer_message(tx: Transaction) -> str:
    status = _customer_status(tx)
    if status == "Blocked":
        return "This transaction was blocked. Contact support if you recognize it."
    if status == "Under Review":
        return "This transaction requires verification. You can request a review if it was not yours."
    return "This transaction appears safe."

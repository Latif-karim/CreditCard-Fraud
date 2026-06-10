from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from ..fraud.engine import evaluate_transaction
from ..services.rbac import actor_user_id, can_manage_transaction, is_staff
from ..services.transaction_ingest import ingest_transaction_data
from ..fraud.explain import explain_features
from ..fraud.model import predict_fraud_probability
from ..models import FraudDecision, Transaction, UserProfile

fraud_bp = Blueprint("fraud", __name__, url_prefix="/fraud")


def _velocity_context(user_id: int, tx: Transaction | None = None) -> tuple[float, float, float, bool, str]:
    ten_minutes_ago = datetime.utcnow() - timedelta(minutes=10)
    tx_frequency_10m = float(
        Transaction.query.filter(
            Transaction.user_id == user_id, Transaction.created_at >= ten_minutes_ago
        ).count()
    )
    last_tx = (
        Transaction.query.filter_by(user_id=user_id)
        .filter(Transaction.id != (tx.id if tx else -1))
        .order_by(Transaction.created_at.desc())
        .first()
    )
    minutes_since_last = 9999.0
    if last_tx:
        anchor = tx.created_at if tx else datetime.utcnow()
        delta = anchor - last_tx.created_at
        minutes_since_last = max(0.0, delta.total_seconds() / 60)

    profile = UserProfile.query.filter_by(user_id=user_id).first()
    amount_vs_avg = 1.0
    location_novel = False
    merchant_category = ""
    if profile:
        if profile.avg_spend > 0 and tx:
            amount_vs_avg = tx.amount / profile.avg_spend
        known = [x.strip() for x in profile.top_locations.split(",") if x.strip()]
        if tx and known:
            location_novel = tx.location not in known
    if tx:
        merchant_category = tx.merchant_category or ""
    return tx_frequency_10m, minutes_since_last, amount_vs_avg, location_novel, merchant_category


@fraud_bp.post("/simulate")
@jwt_required()
def simulate():
    """Manual transaction simulation for deep learning showcase."""
    if not is_staff():
        return jsonify({"error": "Staff role required"}), 403
    data = request.get_json() or {}
    user_id = int(data.get("user_id", 1))
    amount = float(data.get("amount", 0))
    location = str(data.get("location", "Unknown"))
    persist = bool(data.get("persist", False))

    result = evaluate_transaction(
        user_id=user_id,
        amount=amount,
        location=location,
        country=str(data.get("country") or location),
        merchant=str(data.get("merchant") or ""),
        merchant_category=str(data.get("merchant_category") or ""),
        device_id=str(data.get("device_id") or ""),
        ip_address=str(data.get("ip_address") or ""),
    )

    tx_frequency_10m, minutes_since_last, amount_vs_avg, location_novel, merchant_category = _velocity_context(
        user_id
    )
    ml = predict_fraud_probability(
        amount=amount,
        tx_frequency_10m=tx_frequency_10m,
        minutes_since_last=minutes_since_last,
        location=location,
        country=str(data.get("country") or location),
        merchant=str(data.get("merchant") or ""),
        merchant_category=merchant_category,
        device_id=str(data.get("device_id") or ""),
        ip_address=str(data.get("ip_address") or ""),
        amount_vs_avg=amount_vs_avg,
        location_novel=location_novel,
    )

    features = explain_features(
        amount=amount,
        tx_frequency_10m=tx_frequency_10m,
        minutes_since_last=minutes_since_last,
        ml_probability=ml.probability,
        cnn_probability=ml.cnn_probability,
        autoencoder_score=ml.autoencoder_score,
        rule_reasons=[r for r in result.reasons if "amount" in r.lower() or "velocity" in r.lower()],
        behavior_reasons=[r for r in result.reasons if "location" in r.lower() or "average" in r.lower()],
        merchant_category=merchant_category,
        location_novel=location_novel,
    )

    narrative = (
        f"Combined risk score {result.final_score:.1f} ({result.label}). "
        f"CNN={ml.cnn_probability:.2f}, autoencoder={ml.autoencoder_score:.2f}, "
        f"hybrid={ml.probability:.2f}."
    )

    payload = {
        "risk_score": result.final_score,
        "label": result.label,
        "ml_probability": ml.probability,
        "cnn_probability": ml.cnn_probability,
        "autoencoder_score": ml.autoencoder_score,
        "model_family": result.model_family,
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
    if not is_staff():
        return jsonify({"error": "Staff role required"}), 403

    tx = Transaction.query.get(transaction_id)
    if not tx:
        return jsonify({"error": "Transaction not found"}), 404
    if not can_manage_transaction(tx):
        return jsonify({"error": "Forbidden"}), 403

    decision = FraudDecision.query.filter_by(transaction_id=transaction_id).first()
    tx_frequency_10m, minutes_since_last, amount_vs_avg, location_novel, merchant_category = _velocity_context(
        tx.user_id, tx
    )

    ml_prob = float(decision.ml_probability) if decision else 0.0
    reasons = decision.reasons.split("; ") if decision and decision.reasons else []
    ml = predict_fraud_probability(
        amount=tx.amount,
        tx_frequency_10m=tx_frequency_10m,
        minutes_since_last=minutes_since_last,
        location=tx.location,
        country=tx.country or tx.location,
        merchant=tx.merchant or "",
        merchant_category=tx.merchant_category or "",
        device_id=tx.device_id or "",
        ip_address=tx.ip_address or "",
        amount_vs_avg=amount_vs_avg,
        location_novel=location_novel,
    )

    features = explain_features(
        amount=tx.amount,
        tx_frequency_10m=tx_frequency_10m,
        minutes_since_last=minutes_since_last,
        ml_probability=ml_prob or ml.probability,
        cnn_probability=ml.cnn_probability,
        autoencoder_score=ml.autoencoder_score,
        rule_reasons=[r for r in reasons if "amount" in r.lower() or "velocity" in r.lower()],
        behavior_reasons=[r for r in reasons if "location" in r.lower() or "average" in r.lower()],
        merchant_category=merchant_category,
        location_novel=location_novel,
    )

    return (
        jsonify(
            {
                "transaction_id": tx.id,
                "risk_score": tx.risk_score,
                "status": tx.status,
                "ml_probability": ml_prob or ml.probability,
                "cnn_probability": ml.cnn_probability,
                "autoencoder_score": ml.autoencoder_score,
                "model_family": ml.model_family,
                "decision_label": decision.final_label if decision else "unknown",
                "stored_reasons": reasons,
                "feature_importance": features,
            }
        ),
        200,
    )

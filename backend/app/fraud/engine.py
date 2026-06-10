from dataclasses import dataclass
from datetime import datetime, timedelta

from ..models import Transaction, UserProfile
from .behavior import evaluate_behavior
from .model import predict_fraud_probability
from .rules import evaluate_rules


@dataclass
class FraudResult:
    final_score: float
    label: str
    reasons: list[str]
    rule_score: float
    behavior_score: float
    ml_score: float
    ml_probability: float
    cnn_probability: float
    autoencoder_score: float
    model_family: str


def _risk_label(score: float) -> str:
    if score >= 80:
        return "critical"
    if score >= 60:
        return "high"
    if score >= 30:
        return "medium"
    return "low"


def _velocity_context(user_id: int) -> tuple[float, float, float, bool]:
    ten_minutes_ago = datetime.utcnow() - timedelta(minutes=10)
    tx_frequency_10m = float(
        Transaction.query.filter(
            Transaction.user_id == user_id, Transaction.created_at >= ten_minutes_ago
        ).count()
    )
    last_tx = (
        Transaction.query.filter_by(user_id=user_id)
        .order_by(Transaction.created_at.desc())
        .first()
    )
    minutes_since_last = 9999.0
    if last_tx:
        delta = datetime.utcnow() - last_tx.created_at
        minutes_since_last = delta.total_seconds() / 60

    return tx_frequency_10m, minutes_since_last, 1.0, False


def evaluate_transaction(
    user_id: int,
    amount: float,
    location: str,
    *,
    country: str = "",
    merchant: str = "",
    merchant_category: str = "",
    device_id: str = "",
    ip_address: str = "",
) -> FraudResult:
    rule_result = evaluate_rules(user_id=user_id, amount=amount, location=location)
    behavior_score, behavior_reasons = evaluate_behavior(
        user_id=user_id, amount=amount, location=location
    )

    tx_frequency_10m, minutes_since_last, _, _ = _velocity_context(user_id)
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    amount_vs_avg = amount / profile.avg_spend if profile and profile.avg_spend > 0 else 1.0
    known_locations = (
        [x.strip() for x in profile.top_locations.split(",") if x.strip()] if profile else []
    )
    location_novel = bool(known_locations and location not in known_locations)

    ml_result = predict_fraud_probability(
        amount=amount,
        tx_frequency_10m=tx_frequency_10m,
        minutes_since_last=minutes_since_last,
        location=location,
        country=country or location,
        merchant=merchant,
        merchant_category=merchant_category,
        device_id=device_id,
        ip_address=ip_address,
        amount_vs_avg=amount_vs_avg,
        location_novel=location_novel,
    )

    # Production-style layered scoring: rules → behavior → deep learning ensemble.
    final_score = min(100.0, rule_result.score + behavior_score + ml_result.score)
    label = _risk_label(final_score)
    reasons = rule_result.reasons + behavior_reasons + ml_result.reasons

    return FraudResult(
        final_score=final_score,
        label=label,
        reasons=reasons,
        rule_score=rule_result.score,
        behavior_score=behavior_score,
        ml_score=ml_result.score,
        ml_probability=ml_result.probability,
        cnn_probability=ml_result.cnn_probability,
        autoencoder_score=ml_result.autoencoder_score,
        model_family=ml_result.model_family,
    )

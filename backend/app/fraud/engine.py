from dataclasses import dataclass
from datetime import datetime, timedelta

from ..models import Transaction
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


def _risk_label(score: float) -> str:
    if score >= 80:
        return "critical"
    if score >= 60:
        return "high"
    if score >= 30:
        return "medium"
    return "low"


def evaluate_transaction(user_id: int, amount: float, location: str) -> FraudResult:
    rule_result = evaluate_rules(user_id=user_id, amount=amount, location=location)
    behavior_score, behavior_reasons = evaluate_behavior(
        user_id=user_id, amount=amount, location=location
    )

    ten_minutes_ago = datetime.utcnow() - timedelta(minutes=10)
    tx_frequency_10m = (
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

    ml_result = predict_fraud_probability(
        amount=amount,
        tx_frequency_10m=tx_frequency_10m,
        minutes_since_last=minutes_since_last,
    )

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
    )

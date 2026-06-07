from dataclasses import dataclass
from datetime import datetime, timedelta

from ..models import Transaction
from ..services.fraud_rules_config import is_rule_enabled

# Default thresholds when DB rules are missing (matches seeded fraud_rule rows).
_DEFAULT_AMOUNT_THRESHOLD = 5000.0
_DEFAULT_VELOCITY_COUNT = 5
_DEFAULT_VELOCITY_WINDOW_MINUTES = 10


@dataclass
class RuleResult:
    score: float
    reasons: list[str]


def evaluate_rules(user_id: int, amount: float, location: str) -> RuleResult:
    score = 0.0
    reasons: list[str] = []

    if is_rule_enabled("high_amount") and amount > _DEFAULT_AMOUNT_THRESHOLD:
        score += 20
        reasons.append(f"High transaction amount (above ${_DEFAULT_AMOUNT_THRESHOLD:,.0f})")

    if is_rule_enabled("velocity_window"):
        window_start = datetime.utcnow() - timedelta(minutes=_DEFAULT_VELOCITY_WINDOW_MINUTES)
        recent_count = (
            Transaction.query.filter(
                Transaction.user_id == user_id,
                Transaction.created_at >= window_start,
            ).count()
        )
        if recent_count >= _DEFAULT_VELOCITY_COUNT:
            score += 15
            reasons.append(
                f"High transaction velocity ({recent_count} in {_DEFAULT_VELOCITY_WINDOW_MINUTES} minutes)"
            )

    if is_rule_enabled("location_mismatch"):
        recent_location = (
            Transaction.query.filter(Transaction.user_id == user_id)
            .order_by(Transaction.created_at.desc())
            .first()
        )
        if recent_location and recent_location.location != location:
            score += 10
            reasons.append("Location differs from recent activity")

    return RuleResult(score=score, reasons=reasons)

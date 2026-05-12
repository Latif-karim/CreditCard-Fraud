from dataclasses import dataclass
from datetime import datetime, timedelta

from ..models import Transaction


@dataclass
class RuleResult:
    score: float
    reasons: list[str]


def evaluate_rules(user_id: int, amount: float, location: str) -> RuleResult:
    score = 0.0
    reasons: list[str] = []

    if amount > 5000:
        score += 20
        reasons.append("High transaction amount")

    ten_minutes_ago = datetime.utcnow() - timedelta(minutes=10)
    recent_count = (
        Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.created_at >= ten_minutes_ago,
        ).count()
    )
    if recent_count >= 5:
        score += 15
        reasons.append("High transaction velocity in 10 minutes")

    recent_location = (
        Transaction.query.filter(Transaction.user_id == user_id)
        .order_by(Transaction.created_at.desc())
        .first()
    )
    if recent_location and recent_location.location != location:
        score += 10
        reasons.append("Location differs from recent activity")

    return RuleResult(score=score, reasons=reasons)

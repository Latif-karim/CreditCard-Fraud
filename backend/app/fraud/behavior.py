from collections import Counter

from ..models import Transaction, UserProfile


def update_user_profile(user_id: int, amount: float, location: str) -> None:
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id, avg_spend=amount, tx_count=1, top_locations=location)
        from ..extensions import db

        db.session.add(profile)
        return

    profile.tx_count += 1
    profile.avg_spend = ((profile.avg_spend * (profile.tx_count - 1)) + amount) / profile.tx_count

    locations = [x.strip() for x in profile.top_locations.split(",") if x.strip()]
    locations.append(location)
    common = [item for item, _ in Counter(locations).most_common(3)]
    profile.top_locations = ",".join(common)


def evaluate_behavior(user_id: int, amount: float, location: str) -> tuple[float, list[str]]:
    score = 0.0
    reasons: list[str] = []
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        return score, reasons

    if profile.avg_spend > 0 and amount > profile.avg_spend * 2.5:
        score += 15
        reasons.append("Amount is far above user average spend")

    known_locations = [x.strip() for x in profile.top_locations.split(",") if x.strip()]
    if known_locations and location not in known_locations:
        score += 10
        reasons.append("Unusual location compared to user history")

    last_tx = (
        Transaction.query.filter_by(user_id=user_id)
        .order_by(Transaction.created_at.desc())
        .first()
    )
    if last_tx and abs((last_tx.amount - amount) / max(last_tx.amount, 1)) > 3:
        score += 5
        reasons.append("Sudden amount jump from previous transaction")

    return score, reasons

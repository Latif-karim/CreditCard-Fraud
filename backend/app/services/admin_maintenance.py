"""Admin-only user removal and transaction data purge."""

from __future__ import annotations

from collections import Counter

from ..extensions import db
from ..models import (
    Alert,
    AuditLog,
    DisputeCase,
    FraudDecision,
    FraudNotification,
    Transaction,
    User,
    UserProfile,
    UserSession,
)


def count_platform_records() -> dict:
    return {
        "users": User.query.count(),
        "transactions": Transaction.query.count(),
        "fraud_decisions": FraudDecision.query.count(),
        "disputes": DisputeCase.query.count(),
        "alerts": Alert.query.count(),
        "notifications": FraudNotification.query.count(),
        "audit_logs": AuditLog.query.count(),
    }


def _delete_transactions_by_ids(tx_ids: list[int]) -> int:
    if not tx_ids:
        return 0
    FraudDecision.query.filter(FraudDecision.transaction_id.in_(tx_ids)).delete(
        synchronize_session=False
    )
    Alert.query.filter(Alert.transaction_id.in_(tx_ids)).delete(synchronize_session=False)
    FraudNotification.query.filter(FraudNotification.transaction_id.in_(tx_ids)).delete(
        synchronize_session=False
    )
    DisputeCase.query.filter(DisputeCase.transaction_id.in_(tx_ids)).delete(
        synchronize_session=False
    )
    return Transaction.query.filter(Transaction.id.in_(tx_ids)).delete(synchronize_session=False)


def rebuild_user_profile(user_id: int) -> None:
    """Recalculate behavioral profile from remaining transactions."""
    txs = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.created_at.asc()).all()
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not txs:
        if profile:
            profile.avg_spend = 0.0
            profile.tx_count = 0
            profile.top_locations = ""
        return
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.session.add(profile)
    profile.tx_count = len(txs)
    profile.avg_spend = sum(t.amount for t in txs) / len(txs)
    top = [loc for loc, _ in Counter(t.location for t in txs).most_common(3)]
    profile.top_locations = ",".join(top)


def _reset_profile_for_user(user_id: int) -> None:
    rebuild_user_profile(user_id)


def delete_user_and_related(user_id: int) -> dict:
    """Remove a user and all of their transactions and sessions."""
    tx_ids = [
        row[0]
        for row in db.session.query(Transaction.id).filter_by(user_id=user_id).all()
    ]
    transactions_removed = _delete_transactions_by_ids(tx_ids)
    _reset_profile_for_user(user_id)

    UserSession.query.filter_by(user_id=user_id).delete(synchronize_session=False)
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    if profile:
        db.session.delete(profile)

    FraudNotification.query.filter_by(user_id=user_id).delete(synchronize_session=False)

    user = User.query.get(user_id)
    if not user:
        return {"transactions_removed": transactions_removed, "user_removed": False}

    email = user.email
    db.session.delete(user)
    return {
        "transactions_removed": transactions_removed,
        "user_removed": True,
        "email": email,
    }


def delete_transaction_by_id(transaction_id: int) -> dict:
    """Delete one transaction and related fraud/alert records."""
    tx = Transaction.query.get(transaction_id)
    if not tx:
        return {"deleted": False, "transaction_id": transaction_id}

    user_id = tx.user_id
    removed = _delete_transactions_by_ids([transaction_id])
    rebuild_user_profile(user_id)
    return {
        "deleted": removed > 0,
        "transaction_id": transaction_id,
        "user_id": user_id,
    }


def purge_all_transaction_data() -> dict:
    """Delete every transaction and dependent fraud/alert records. Users are kept."""
    decisions_removed = FraudDecision.query.delete(synchronize_session=False)
    disputes_removed = DisputeCase.query.delete(synchronize_session=False)
    alerts_removed = Alert.query.delete(synchronize_session=False)
    notifications_removed = FraudNotification.query.delete(synchronize_session=False)
    transactions_removed = Transaction.query.delete(synchronize_session=False)

    for profile in UserProfile.query.all():
        profile.avg_spend = 0.0
        profile.tx_count = 0
        profile.top_locations = ""

    return {
        "transactions_removed": transactions_removed,
        "fraud_decisions_removed": decisions_removed,
        "disputes_removed": disputes_removed,
        "alerts_removed": alerts_removed,
        "notifications_removed": notifications_removed,
    }

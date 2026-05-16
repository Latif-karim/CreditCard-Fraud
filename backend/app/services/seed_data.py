"""Bootstrap demo users, audit logs, and transactions when the DB is sparse."""

from datetime import datetime, timedelta
import random

from ..extensions import db
from ..models import AuditLog, Transaction, User
from .transaction_generator import random_transaction_payload
from .transaction_ingest import ingest_transaction_data


def ensure_demo_users() -> list[int]:
    """Return list of user ids (creates demo accounts if needed)."""
    ids: list[int] = []
    demos = [
        ("analyst@fraudshield.demo", "analyst", "Demo Analyst"),
        ("user@fraudshield.demo", "user", "Demo Cardholder"),
        ("ops@fraudshield.demo", "admin", "Demo Admin"),
    ]
    for email, role, name in demos:
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(
                email=email,
                role=role,
                full_name=name,
                email_verified=True,
                is_active=True,
            )
            user.set_password("DemoPass123!")
            db.session.add(user)
            db.session.flush()
        ids.append(user.id)

    # Any other registered users
    for u in User.query.all():
        if u.id not in ids:
            ids.append(u.id)
    db.session.commit()
    return ids


def seed_transactions_if_needed(*, min_count: int = 80) -> int:
    """Seed synthetic transactions until at least min_count exist. Returns rows added."""
    current = Transaction.query.count()
    if current >= min_count:
        return 0

    user_ids = ensure_demo_users()
    needed = min_count - current
    added = 0

    for i in range(needed):
        uid = random.choice(user_ids)
        payload = random_transaction_payload(uid)
        try:
            ingest_transaction_data(payload, actor_user_id=None)
            added += 1
        except Exception:
            db.session.rollback()
            continue

    if AuditLog.query.count() < 5:
        db.session.add(
            AuditLog(
                actor_user_id=user_ids[0] if user_ids else None,
                action="demo_seed",
                entity="system",
                entity_id="seed",
                details='{"message": "Demo dataset initialized"}',
                created_at=datetime.utcnow() - timedelta(hours=2),
            )
        )
        db.session.commit()

    return added


def seed_all(*, min_transactions: int = 80) -> dict:
    user_ids = ensure_demo_users()
    added = seed_transactions_if_needed(min_count=min_transactions)
    return {
        "users": len(user_ids),
        "transactions_added": added,
        "transaction_total": Transaction.query.count(),
    }

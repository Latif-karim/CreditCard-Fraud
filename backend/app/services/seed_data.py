"""Bootstrap demo users, audit logs, and transactions when the DB is sparse."""

from __future__ import annotations

import logging
import random
from collections import Counter
from datetime import datetime, timedelta

from ..extensions import db
from ..models import AuditLog, FraudDecision, Transaction, User, UserProfile
from .admin_maintenance import purge_all_transaction_data
from .transaction_generator import (
    REALISTIC_FLAGGED_RATE,
    normal_transaction_payload,
    suspicious_transaction_payload,
)

logger = logging.getLogger(__name__)


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
                approved=True,
            )
            user.set_password("DemoPass123!")
            db.session.add(user)
            db.session.flush()
        else:
            user.role = role
            user.full_name = name or user.full_name
            user.email_verified = True
            user.is_active = True
            user.approved = True
        ids.append(user.id)

    db.session.commit()
    return ids


def _score_bundle(*, flagged: bool) -> dict:
    if flagged:
        risk_score = round(random.uniform(62.0, 91.0), 1)
        label = "high" if risk_score < 80 else "critical"
        reasons = random.choice(
            [
                "Unusual location compared to user history",
                "High transaction amount (above $5,000)",
                "Location differs from recent activity",
                "ML model detected high fraud probability",
            ]
        )
        rule_score = round(random.uniform(10.0, 25.0), 1)
        behavior_score = round(random.uniform(10.0, 20.0), 1)
        ml_score = round(max(0.0, risk_score - rule_score - behavior_score), 1)
        ml_probability = round(min(0.99, ml_score / 35.0), 4)
    else:
        risk_score = round(random.uniform(4.0, 48.0), 1)
        label = "low" if risk_score < 30 else "medium"
        reasons = "No fraud indicators"
        rule_score = 0.0
        behavior_score = round(random.uniform(0.0, 12.0), 1)
        ml_score = round(max(0.0, risk_score - behavior_score), 1)
        ml_probability = round(min(0.45, ml_score / 35.0), 4)

    return {
        "risk_score": risk_score,
        "label": label,
        "reasons": reasons,
        "rule_score": rule_score,
        "behavior_score": behavior_score,
        "ml_score": ml_score,
        "ml_probability": ml_probability,
        "status": "flagged" if flagged else "approved",
    }


def _cardholder_ids(user_ids: list[int]) -> list[int]:
    if not user_ids:
        return []
    rows = User.query.filter(User.id.in_(user_ids), User.role == "user").with_entities(User.id).all()
    holders = [row[0] for row in rows]
    return holders or user_ids


def _apply_profiles_from_transactions(transactions: list[Transaction]) -> None:
    """Rebuild user profiles in memory from seeded transactions (no per-user DB scans)."""
    by_user: dict[int, list[Transaction]] = {}
    for tx in transactions:
        by_user.setdefault(tx.user_id, []).append(tx)

    for user_id, txs in by_user.items():
        txs.sort(key=lambda t: t.created_at)
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        if not profile:
            profile = UserProfile(user_id=user_id)
            db.session.add(profile)
        profile.tx_count = len(txs)
        profile.avg_spend = sum(t.amount for t in txs) / len(txs)
        top = [loc for loc, _ in Counter(t.location for t in txs).most_common(3)]
        profile.top_locations = ",".join(top)


def seed_realistic_transactions(*, min_count: int = 80) -> int:
    """Seed spread-out historical transactions targeting ~4% flagged rate."""
    demo_ids = ensure_demo_users()
    cardholder_ids = _cardholder_ids(demo_ids)
    if not cardholder_ids:
        return 0

    start = datetime.utcnow() - timedelta(days=60)
    flagged_target = max(1, int(round(min_count * REALISTIC_FLAGGED_RATE)))
    flagged_slots = set(random.sample(range(min_count), flagged_target))

    transactions: list[Transaction] = []
    decisions: list[dict] = []

    for i in range(min_count):
        uid = cardholder_ids[i % len(cardholder_ids)]
        flagged = i in flagged_slots
        payload = suspicious_transaction_payload(uid) if flagged else normal_transaction_payload(uid)
        scores = _score_bundle(flagged=flagged)
        created_at = start + timedelta(
            hours=(i * (60 * 24 / max(min_count, 1))) + random.uniform(0.5, 8.0)
        )
        tx = Transaction(
            user_id=uid,
            amount=float(payload["amount"]),
            location=payload["location"],
            country=payload.get("country") or payload["location"],
            merchant=payload.get("merchant"),
            merchant_category=payload.get("merchant_category"),
            card_last4=payload.get("card_last4"),
            card_type=payload.get("card_type") or "unknown",
            ip_address=payload.get("ip_address"),
            device_id=payload.get("device_id"),
            risk_score=scores["risk_score"],
            confidence=scores["ml_probability"],
            status=scores["status"],
            created_at=created_at,
        )
        transactions.append(tx)
        decisions.append(scores)

    db.session.add_all(transactions)
    db.session.flush()

    db.session.add_all(
        [
            FraudDecision(
                transaction_id=tx.id,
                rule_score=scores["rule_score"],
                behavior_score=scores["behavior_score"],
                ml_score=scores["ml_score"],
                ml_probability=scores["ml_probability"],
                reasons=scores["reasons"],
                final_label=scores["label"],
            )
            for tx, scores in zip(transactions, decisions)
        ]
    )

    _apply_profiles_from_transactions(transactions)

    if AuditLog.query.count() < 5:
        db.session.add(
            AuditLog(
                actor_user_id=demo_ids[0] if demo_ids else None,
                action="dataset_seed",
                entity="system",
                entity_id="seed",
                details='{"message": "Realistic sample transaction data initialized"}',
                created_at=datetime.utcnow() - timedelta(hours=2),
            )
        )

    db.session.commit()
    return len(transactions)


def seed_transactions_if_needed(*, min_count: int = 80) -> int:
    """Seed synthetic transactions until at least min_count exist. Returns rows added."""
    current = Transaction.query.count()
    if current >= min_count:
        return 0
    return seed_realistic_transactions(min_count=min_count - current)


def reseed_realistic_demo_data(*, min_transactions: int = 80) -> dict:
    """Replace all transaction data with a realistic historical dataset."""
    purge = purge_all_transaction_data()
    db.session.commit()
    try:
        added = seed_realistic_transactions(min_count=min_transactions)
    except Exception:
        logger.exception("Realistic reseed failed")
        db.session.rollback()
        raise

    total = Transaction.query.count()
    flagged = Transaction.query.filter_by(status="flagged").count()
    return {
        "purged": purge,
        "transactions_added": added,
        "transaction_total": total,
        "flagged_transactions": flagged,
        "flagged_rate": round(flagged / total, 4) if total else 0.0,
    }


def seed_all(*, min_transactions: int = 80) -> dict:
    user_ids = ensure_demo_users()
    added = seed_transactions_if_needed(min_count=min_transactions)
    total = Transaction.query.count()
    flagged = Transaction.query.filter_by(status="flagged").count()
    return {
        "users": len(user_ids),
        "transactions_added": added,
        "transaction_total": total,
        "flagged_transactions": flagged,
        "flagged_rate": round(flagged / total, 4) if total else 0.0,
    }

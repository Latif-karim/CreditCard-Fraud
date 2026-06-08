"""Serialize domain rows for the live SSE stream."""

from __future__ import annotations

from ..models import FraudDecision, FraudNotification, Transaction


def notification_dict(n: FraudNotification) -> dict:
    return {
        "id": n.id,
        "title": n.title,
        "body": n.body,
        "severity": n.severity,
        "category": n.category,
        "read": n.read,
        "created_at": n.created_at.isoformat(),
        "transaction_id": n.transaction_id,
    }


def transaction_dict(tx: Transaction) -> dict:
    dec = FraudDecision.query.filter_by(transaction_id=tx.id).first()
    return {
        "id": tx.id,
        "user_id": tx.user_id,
        "amount": tx.amount,
        "location": tx.location,
        "country": tx.country,
        "merchant": tx.merchant,
        "merchant_category": tx.merchant_category,
        "card_last4": tx.card_last4,
        "card_type": tx.card_type,
        "ip_address": tx.ip_address,
        "device_id": tx.device_id,
        "status": tx.status,
        "risk_score": tx.risk_score,
        "confidence": tx.confidence or (dec.ml_probability if dec else 0.0),
        "created_at": tx.created_at.isoformat(),
    }


def publish_transaction_created(tx: Transaction, notification: FraudNotification | None = None) -> None:
    from .live_events import publish

    event: dict = {
        "type": "transaction.created",
        "transaction": transaction_dict(tx),
    }
    if notification is not None:
        event["notification"] = notification_dict(notification)
    publish(event, owner_user_id=tx.user_id)


def publish_transaction_updated(tx: Transaction) -> None:
    from .live_events import publish

    publish(
        {
            "type": "transaction.updated",
            "transaction": transaction_dict(tx),
        },
        owner_user_id=tx.user_id,
    )

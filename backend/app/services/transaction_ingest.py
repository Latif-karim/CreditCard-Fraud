"""Shared transaction ingest pipeline (manual, simulator, seed)."""

from ..extensions import db
from ..fraud.engine import evaluate_transaction
from ..models import FraudDecision, FraudNotification, Transaction
from ..services.alerts import send_email_alert
from ..services.audit import log_action
from ..services.cache import invalidate_read_caches


def ingest_transaction_data(
    data: dict,
    *,
    actor_user_id: int | None = None,
    quiet: bool = False,
) -> dict:
    """Score and persist one transaction. Returns API payload."""
    user_id = int(data["user_id"])
    amount = float(data["amount"])
    location = data["location"]

    result = evaluate_transaction(user_id=user_id, amount=amount, location=location)

    tx = Transaction(
        user_id=user_id,
        amount=amount,
        location=location,
        country=data.get("country") or location,
        merchant=data.get("merchant"),
        merchant_category=data.get("merchant_category"),
        card_last4=data.get("card_last4"),
        card_type=data.get("card_type") or "unknown",
        ip_address=data.get("ip_address"),
        device_id=data.get("device_id"),
        risk_score=result.final_score,
        confidence=result.ml_probability,
        status="flagged" if result.final_score >= 60 else "approved",
    )
    db.session.add(tx)
    db.session.flush()

    decision = FraudDecision(
        transaction_id=tx.id,
        rule_score=result.rule_score,
        behavior_score=result.behavior_score,
        ml_score=result.ml_score,
        ml_probability=result.ml_probability,
        reasons="; ".join(result.reasons) if result.reasons else "No fraud indicators",
        final_label=result.label,
    )
    db.session.add(decision)

    from ..fraud.behavior import update_user_profile

    update_user_profile(user_id, amount, location)

    if actor_user_id is not None:
        log_action(
            actor_user_id=actor_user_id,
            action="transaction_ingested",
            entity="transaction",
            entity_id=str(tx.id),
            details={
                "risk_score": result.final_score,
                "label": result.label,
                "reasons": result.reasons,
            },
        )

    if result.final_score >= 60 and not quiet:
        send_email_alert(
            transaction_id=tx.id,
            user_id=user_id,
            message=f"Suspicious transaction detected with score {result.final_score:.2f}.",
        )
        db.session.add(
            FraudNotification(
                title="Fraud alert: high risk transaction",
                body=f"Transaction #{tx.id} scored {result.final_score:.1f}. Review required.",
                severity="critical" if result.final_score >= 80 else "high",
                category="suspicious_transaction",
                user_id=user_id,
                transaction_id=tx.id,
            )
        )

    db.session.commit()
    invalidate_read_caches(user_id)
    return {
        "transaction_id": tx.id,
        "risk_score": result.final_score,
        "label": result.label,
        "status": tx.status,
        "confidence": result.ml_probability,
        "reasons": result.reasons,
    }

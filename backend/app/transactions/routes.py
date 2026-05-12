from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..fraud.behavior import update_user_profile
from ..fraud.engine import evaluate_transaction
from ..models import FraudDecision, Transaction
from ..schemas import TransactionIngestSchema
from ..services.alerts import send_email_alert
from ..services.audit import log_action

transactions_bp = Blueprint("transactions", __name__, url_prefix="/transactions")


@transactions_bp.post("/ingest")
@jwt_required()
def ingest_transaction():
    actor_user_id = get_jwt_identity()
    data = TransactionIngestSchema().load(request.get_json() or {})
    result = evaluate_transaction(
        user_id=data["user_id"], amount=data["amount"], location=data["location"]
    )

    tx = Transaction(
        user_id=data["user_id"],
        amount=data["amount"],
        location=data["location"],
        merchant=data.get("merchant"),
        card_last4=data.get("card_last4"),
        risk_score=result.final_score,
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
    update_user_profile(data["user_id"], data["amount"], data["location"])

    log_action(
        actor_user_id=int(actor_user_id) if actor_user_id else None,
        action="transaction_ingested",
        entity="transaction",
        entity_id=str(tx.id),
        details={
            "risk_score": result.final_score,
            "label": result.label,
            "reasons": result.reasons,
        },
    )

    if result.final_score >= 60:
        send_email_alert(
            transaction_id=tx.id,
            user_id=data["user_id"],
            message=f"Suspicious transaction detected with score {result.final_score:.2f}.",
        )

    db.session.commit()
    return (
        jsonify(
            {
                "transaction_id": tx.id,
                "risk_score": result.final_score,
                "label": result.label,
                "status": tx.status,
                "reasons": result.reasons,
            }
        ),
        201,
    )


@transactions_bp.get("/flagged")
@jwt_required()
def flagged_transactions():
    txs = (
        Transaction.query.filter(Transaction.status == "flagged")
        .order_by(Transaction.created_at.desc())
        .limit(100)
        .all()
    )
    payload = [
        {
            "id": tx.id,
            "user_id": tx.user_id,
            "amount": tx.amount,
            "location": tx.location,
            "risk_score": tx.risk_score,
            "created_at": tx.created_at.isoformat(),
        }
        for tx in txs
    ]
    return jsonify(payload), 200

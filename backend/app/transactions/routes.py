from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from sqlalchemy import or_

from ..extensions import db
from ..fraud.behavior import update_user_profile
from ..fraud.engine import evaluate_transaction
from ..fraud.model import predict_fraud_probability
from ..models import FraudDecision, FraudNotification, Transaction, User
from ..schemas import TransactionIngestSchema
from ..services.alerts import send_email_alert
from ..services.audit import log_action

transactions_bp = Blueprint("transactions", __name__, url_prefix="/transactions")


def _role():
    return get_jwt().get("role")


@transactions_bp.post("/ingest")
@jwt_required()
def ingest_transaction():
    actor_user_id = get_jwt_identity()
    data = TransactionIngestSchema().load(request.get_json() or {})
    result = evaluate_transaction(
        user_id=data["user_id"], amount=data["amount"], location=data["location"]
    )

    ten_minutes_ago = datetime.utcnow() - timedelta(minutes=10)
    tx_frequency_10m = (
        Transaction.query.filter(
            Transaction.user_id == data["user_id"], Transaction.created_at >= ten_minutes_ago
        ).count()
    )
    last_tx = (
        Transaction.query.filter_by(user_id=data["user_id"])
        .order_by(Transaction.created_at.desc())
        .first()
    )
    minutes_since_last = 9999.0
    if last_tx:
        delta = datetime.utcnow() - last_tx.created_at
        minutes_since_last = delta.total_seconds() / 60
    ml = predict_fraud_probability(data["amount"], tx_frequency_10m, minutes_since_last)

    tx = Transaction(
        user_id=data["user_id"],
        amount=data["amount"],
        location=data["location"],
        country=data.get("country") or data.get("location"),
        merchant=data.get("merchant"),
        merchant_category=data.get("merchant_category"),
        card_last4=data.get("card_last4"),
        card_type=data.get("card_type") or "unknown",
        ip_address=data.get("ip_address"),
        device_id=data.get("device_id"),
        risk_score=result.final_score,
        confidence=ml.probability,
        status="flagged" if result.final_score >= 60 else "approved",
    )

    db.session.add(tx)
    db.session.flush()

    decision = FraudDecision(
        transaction_id=tx.id,
        rule_score=result.rule_score,
        behavior_score=result.behavior_score,
        ml_score=result.ml_score,
        ml_probability=ml.probability,
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
        db.session.add(
            FraudNotification(
                title="Fraud alert: high risk transaction",
                body=f"Transaction #{tx.id} scored {result.final_score:.1f}. Review required.",
                severity="critical" if result.final_score >= 80 else "high",
                category="suspicious_transaction",
                user_id=data["user_id"],
                transaction_id=tx.id,
            )
        )

    db.session.commit()
    return (
        jsonify(
            {
                "transaction_id": tx.id,
                "risk_score": result.final_score,
                "label": result.label,
                "status": tx.status,
                "confidence": ml.probability,
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
    payload = [_tx_dict(tx) for tx in txs]
    return jsonify(payload), 200


@transactions_bp.get("/list")
@jwt_required()
def list_transactions():
    page = max(1, int(request.args.get("page", 1)))
    per_page = min(100, max(5, int(request.args.get("per_page", 20))))
    q = (request.args.get("q") or "").strip()
    status = request.args.get("status")
    risk_min = request.args.get("risk_min")
    risk_max = request.args.get("risk_max")
    country = request.args.get("country")
    merchant = request.args.get("merchant")
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    sort = request.args.get("sort", "created_at_desc")

    query = Transaction.query
    if q:
        clauses = [
            Transaction.merchant.ilike(f"%{q}%"),
            Transaction.location.ilike(f"%{q}%"),
        ]
        if q.isdigit():
            clauses.append(Transaction.id == int(q))
        if len(q) == 4 and q.isdigit():
            clauses.append(Transaction.card_last4 == q)
        query = query.filter(or_(*clauses))
    if status:
        query = query.filter(Transaction.status == status)
    if country:
        query = query.filter(Transaction.country.ilike(f"%{country}%"))
    if merchant:
        query = query.filter(Transaction.merchant.ilike(f"%{merchant}%"))
    if risk_min:
        query = query.filter(Transaction.risk_score >= float(risk_min))
    if risk_max:
        query = query.filter(Transaction.risk_score <= float(risk_max))
    if date_from:
        try:
            query = query.filter(Transaction.created_at >= datetime.fromisoformat(date_from))
        except ValueError:
            pass
    if date_to:
        try:
            query = query.filter(Transaction.created_at <= datetime.fromisoformat(date_to))
        except ValueError:
            pass

    if sort == "amount_desc":
        query = query.order_by(Transaction.amount.desc())
    elif sort == "amount_asc":
        query = query.order_by(Transaction.amount.asc())
    elif sort == "risk_asc":
        query = query.order_by(Transaction.risk_score.asc())
    else:
        query = query.order_by(Transaction.created_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return (
        jsonify(
            {
                "items": [_tx_dict(tx) for tx in pagination.items],
                "page": page,
                "per_page": per_page,
                "total": pagination.total,
                "pages": pagination.pages,
            }
        ),
        200,
    )


@transactions_bp.patch("/<int:transaction_id>/action")
@jwt_required()
def transaction_action(transaction_id: int):
    data = request.get_json() or {}
    action = (data.get("action") or "").lower()
    tx = Transaction.query.get(transaction_id)
    if not tx:
        return jsonify({"error": "Not found"}), 404

    actor = get_jwt_identity()
    if action == "flag":
        tx.status = "flagged"
    elif action == "approve" or action == "safe":
        tx.status = "approved"
    elif action == "freeze_account":
        if _role() not in ("admin", "analyst"):
            return jsonify({"error": "Forbidden"}), 403
        user = User.query.get(tx.user_id)
        if user:
            user.is_active = False
    else:
        return jsonify({"error": "Invalid action"}), 400

    log_action(
        actor_user_id=int(actor) if actor else None,
        action=f"transaction_{action}",
        entity="transaction",
        entity_id=str(tx.id),
        details={"new_status": tx.status},
    )
    db.session.commit()
    return jsonify({"message": "ok", "status": tx.status}), 200


def _tx_dict(tx: Transaction) -> dict:
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

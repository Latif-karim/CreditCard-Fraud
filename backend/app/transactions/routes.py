from datetime import datetime, timedelta

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from marshmallow import ValidationError
from sqlalchemy import or_

from ..extensions import db
from ..models import FraudDecision, FraudNotification, Transaction, User
from ..schemas import TransactionIngestSchema
from ..services.audit import log_action
from ..services.seed_data import seed_all, seed_transactions_if_needed
from ..services.simulator import simulator_status, start_simulator, stop_simulator, tick_once
from ..services.rbac import can_manage_transaction, is_staff, scope_transactions
from ..services.transaction_ingest import ingest_transaction_data

transactions_bp = Blueprint("transactions", __name__, url_prefix="/transactions")


def _role():
    return get_jwt().get("role")


@transactions_bp.post("/ingest")
@jwt_required()
def ingest_transaction():
    actor_user_id = get_jwt_identity()
    try:
        data = TransactionIngestSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"error": "Validation failed", "details": err.messages}), 400

    role = _role()
    uid = int(actor_user_id) if actor_user_id else None
    if role == "user":
        if not uid:
            return jsonify({"error": "Invalid session"}), 401
        data["user_id"] = uid
    elif not data.get("user_id"):
        return jsonify({"error": "user_id is required"}), 400

    target = User.query.get(int(data["user_id"]))
    if not target:
        return jsonify({"error": f"User id {data['user_id']} does not exist"}), 400
    if not target.is_active:
        return jsonify({"error": "User account is suspended"}), 403

    try:
        result = ingest_transaction_data(data, actor_user_id=uid)
    except Exception as exc:
        db.session.rollback()
        return jsonify({"error": str(exc)}), 500
    return jsonify(result), 201


@transactions_bp.post("/seed")
@jwt_required()
def seed_endpoint():
    if _role() not in ("admin", "analyst"):
        return jsonify({"error": "Forbidden"}), 403
    payload = seed_all(min_transactions=int(request.args.get("min", 80)))
    return jsonify(payload), 200


@transactions_bp.get("/simulator/status")
@jwt_required()
def get_simulator_status():
    return jsonify(simulator_status()), 200


@transactions_bp.post("/simulator/start")
@jwt_required()
def simulator_start():
    if _role() not in ("admin", "analyst"):
        return jsonify({"error": "Simulator requires analyst or admin role"}), 403
    interval = int((request.get_json() or {}).get("interval_seconds", 30))
    status = start_simulator(current_app._get_current_object(), interval_seconds=interval)
    return jsonify(status), 200


@transactions_bp.post("/simulator/stop")
@jwt_required()
def simulator_stop():
    if not is_staff():
        return jsonify({"error": "Forbidden"}), 403
    return jsonify(stop_simulator()), 200


@transactions_bp.post("/simulator/tick")
@jwt_required()
def simulator_tick():
    if not is_staff():
        return jsonify({"error": "Forbidden"}), 403
    """Generate one synthetic transaction immediately."""
    try:
        tick_once(current_app._get_current_object())
        # Return last transaction summary for UI feedback
        tx = Transaction.query.order_by(Transaction.created_at.desc()).first()
        if tx:
            dec = FraudDecision.query.filter_by(transaction_id=tx.id).first()
            return (
                jsonify(
                    {
                        "transaction_id": tx.id,
                        "amount": tx.amount,
                        "location": tx.location,
                        "merchant": tx.merchant,
                        "risk_score": tx.risk_score,
                        "label": dec.final_label if dec else "unknown",
                        "status": tx.status,
                        "confidence": tx.confidence or 0,
                        "reasons": (dec.reasons.split("; ") if dec and dec.reasons else []),
                        "simulator": simulator_status(),
                    }
                ),
                201,
            )
        return jsonify({"message": "tick ok", "simulator": simulator_status()}), 201
    except Exception as exc:
        return jsonify({"error": str(exc), "simulator": simulator_status()}), 500


@transactions_bp.get("/feed")
@jwt_required()
def transaction_feed():
    """Return transactions with id greater than after_id (for live notifications)."""
    after_id = int(request.args.get("after_id", 0))
    txs = (
        scope_transactions(Transaction.query.filter(Transaction.id > after_id))
        .order_by(Transaction.id.asc())
        .limit(25)
        .all()
    )
    latest = scope_transactions(Transaction.query).order_by(Transaction.created_at.desc()).first()
    return (
        jsonify(
            {
                "items": [_tx_dict(tx) for tx in txs],
                "latest_id": latest.id if latest else after_id,
            }
        ),
        200,
    )


@transactions_bp.get("/flagged")
@jwt_required()
def flagged_transactions():
    seed_transactions_if_needed(min_count=20)
    txs = (
        scope_transactions(Transaction.query.filter(Transaction.status == "flagged"))
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

    query = scope_transactions(Transaction.query)
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
    if not can_manage_transaction(tx):
        return jsonify({"error": "Forbidden"}), 403

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

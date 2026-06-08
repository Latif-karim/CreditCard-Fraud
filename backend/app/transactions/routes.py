from datetime import datetime, timedelta
import queue as queue_module

from flask import Blueprint, Response, current_app, jsonify, request, stream_with_context
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError
from sqlalchemy import or_

from ..extensions import db
from ..models import DisputeCase, FraudDecision, FraudNotification, Transaction, User
from ..schemas import TransactionIngestSchema
from ..services.audit import log_action
from ..services.cache import get_or_set, invalidate_read_caches, scoped_key
from ..services.live_events import subscribe, unsubscribe
from ..services.live_payloads import publish_transaction_updated
from ..services.seed_data import reseed_realistic_demo_data, seed_all
from ..services.simulator import simulator_status, start_simulator, stop_simulator, tick_once
from ..services.rbac import actor_user_id, can_manage_transaction, current_role, is_staff, scope_transactions
from ..services.transaction_ingest import ingest_transaction_data

transactions_bp = Blueprint("transactions", __name__, url_prefix="/transactions")


def _cache_ttl(*, live: bool = False) -> float:
    if not current_app.config.get("CACHE_ENABLED", True):
        return 0.0
    if live:
        return 0.0
    return float(current_app.config.get("CACHE_TTL_SECONDS", 30))


def _role():
    return current_role()


def _customer_status(tx: Transaction) -> str:
    status = (tx.status or "").lower()
    if status in ("declined", "blocked", "frozen"):
        return "Blocked"
    if status in ("flagged", "disputed", "pending"):
        return "Under Review"
    return "Safe"


def _risk_level(score: float) -> str:
    if score >= 80:
        return "High Risk"
    if score >= 60:
        return "Medium Risk"
    return "Low Risk"


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

    tx = Transaction.query.get(result["transaction_id"])
    payload = {
        **result,
        "customer_status": _customer_status(tx) if tx else result["status"],
        "message": (
            "Transaction requires verification."
            if result["status"] == "flagged"
            else "Transaction processed."
        ),
    }
    return jsonify(payload), 201


@transactions_bp.post("/seed")
@jwt_required()
def seed_endpoint():
    if _role() not in ("admin", "analyst"):
        return jsonify({"error": "Forbidden"}), 403
    force = request.args.get("force", "").lower() in ("1", "true", "yes")
    if force:
        min_count = int(request.args.get("min", 80))
        payload = reseed_realistic_demo_data(min_transactions=min_count)
        invalidate_read_caches()
    else:
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


@transactions_bp.get("/stream")
@jwt_required(locations=["headers", "query_string"])
def transaction_stream():
    """Server-Sent Events — push live transaction updates (no polling)."""
    identity = get_jwt_identity()
    if not identity:
        return jsonify({"error": "Unauthorized"}), 401
    user_id = int(identity)
    role = current_role()
    sub = subscribe(user_id=user_id, role=role)

    @stream_with_context
    def generate():
        try:
            yield "event: connected\ndata: {}\n\n"
            while True:
                try:
                    msg = sub.queue.get(timeout=25)
                    yield f"event: live\ndata: {msg}\n\n"
                except queue_module.Empty:
                    yield ": heartbeat\n\n"
        finally:
            unsubscribe(sub)

    response = Response(generate(), mimetype="text/event-stream")
    response.headers["Cache-Control"] = "no-cache"
    response.headers["Connection"] = "keep-alive"
    response.headers["X-Accel-Buffering"] = "no"
    return response


@transactions_bp.get("/flagged")
@jwt_required()
def flagged_transactions():
    role = current_role()
    uid = actor_user_id()
    ttl = _cache_ttl(live=True)

    def build():
        txs = (
            scope_transactions(Transaction.query.filter(Transaction.status == "flagged"))
            .order_by(Transaction.created_at.desc())
            .limit(100)
            .all()
        )
        return [_tx_dict(tx) for tx in txs]

    payload = build() if ttl <= 0 else get_or_set(
        scoped_key("transactions", "flagged", role, uid), ttl, build
    )
    return jsonify(payload), 200


@transactions_bp.get("/list")
@jwt_required()
def list_transactions():
    role = current_role()
    uid = actor_user_id()
    ttl = _cache_ttl(live=True)
    query_key = request.query_string.decode("utf-8") or "default"

    def build():
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
        return {
            "items": [_tx_dict(tx) for tx in pagination.items],
            "page": page,
            "per_page": per_page,
            "total": pagination.total,
            "pages": pagination.pages,
        }

    payload = build() if ttl <= 0 else get_or_set(
        scoped_key("transactions", "list", role, uid, query_key), ttl, build
    )
    return jsonify(payload), 200


@transactions_bp.patch("/<int:transaction_id>/action")
@jwt_required()
def transaction_action(transaction_id: int):
    if not is_staff():
        return jsonify({"error": "Use dispute or review request actions for customer accounts"}), 403

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
            if user.role == "admin":
                return jsonify({"error": "Administrator accounts cannot be frozen"}), 400
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
    invalidate_read_caches(tx.user_id)
    publish_transaction_updated(tx)
    return jsonify({"message": "ok", "status": tx.status}), 200


@transactions_bp.post("/<int:transaction_id>/dispute")
@jwt_required()
def dispute_transaction(transaction_id: int):
    tx = Transaction.query.get(transaction_id)
    if not tx:
        return jsonify({"error": "Not found"}), 404
    if not can_manage_transaction(tx):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    reason = (data.get("reason") or "request_review").strip().lower()
    if reason not in ("report_transaction", "not_mine", "request_review"):
        return jsonify({"error": "Invalid dispute reason"}), 400

    existing = DisputeCase.query.filter_by(transaction_id=tx.id).first()
    if existing:
        return (
            jsonify(
                {
                    "message": "Review request already exists",
                    "case_id": existing.id,
                    "status": existing.status,
                    "transaction_status": tx.status,
                }
            ),
            200,
        )

    case = DisputeCase(
        transaction_id=tx.id,
        user_id=tx.user_id,
        reason=reason,
        customer_note=(data.get("note") or "").strip()[:1000],
        status="open",
    )
    tx.status = "disputed"
    db.session.add(case)
    db.session.add(
        FraudNotification(
            title="Review request submitted",
            body=f"Transaction #{tx.id} has been sent to the fraud team for review.",
            severity="medium",
            category="transaction_review",
            user_id=tx.user_id,
            transaction_id=tx.id,
        )
    )
    log_action(
        actor_user_id=actor_user_id(),
        action="transaction_disputed",
        entity="transaction",
        entity_id=str(tx.id),
        details={"reason": reason},
    )
    db.session.commit()
    invalidate_read_caches(tx.user_id)
    return (
        jsonify(
            {
                "message": "Review request submitted",
                "case_id": case.id,
                "status": case.status,
                "transaction_status": tx.status,
            }
        ),
        201,
    )


def _tx_dict(tx: Transaction) -> dict:
    dec = FraudDecision.query.filter_by(transaction_id=tx.id).first()
    include_internal = is_staff()
    payload = {
        "id": tx.id,
        "user_id": tx.user_id,
        "amount": tx.amount,
        "location": tx.location,
        "country": tx.country,
        "merchant": tx.merchant,
        "merchant_category": tx.merchant_category,
        "card_last4": tx.card_last4,
        "card_type": tx.card_type,
        "status": tx.status,
        "created_at": tx.created_at.isoformat(),
        "customer_status": _customer_status(tx),
        "risk_level": _risk_level(tx.risk_score),
    }
    if include_internal:
        payload.update(
            {
                "ip_address": tx.ip_address,
                "device_id": tx.device_id,
                "risk_score": tx.risk_score,
                "confidence": tx.confidence or (dec.ml_probability if dec else 0.0),
            }
        )
    else:
        payload.update({"ip_address": None, "device_id": None, "risk_score": 0.0, "confidence": 0.0})
    return payload

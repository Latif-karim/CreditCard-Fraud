from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from ..extensions import db
from ..models import DisputeCase, FraudNotification, Transaction, User
from ..services.audit import log_action
from ..services.cache import invalidate_read_caches
from ..services.rbac import actor_user_id, is_staff

disputes_bp = Blueprint("disputes", __name__, url_prefix="/disputes")


def _case_dict(case: DisputeCase) -> dict:
    tx = case.transaction
    user = User.query.get(case.user_id)
    return {
        "id": case.id,
        "transaction_id": case.transaction_id,
        "user_id": case.user_id,
        "user_email": user.email if user else None,
        "reason": case.reason,
        "status": case.status,
        "customer_note": case.customer_note,
        "resolution_note": case.resolution_note,
        "created_at": case.created_at.isoformat(),
        "updated_at": case.updated_at.isoformat(),
        "transaction": {
            "id": tx.id,
            "amount": tx.amount,
            "merchant": tx.merchant,
            "location": tx.location,
            "status": tx.status,
            "risk_score": tx.risk_score,
            "created_at": tx.created_at.isoformat(),
        }
        if tx
        else None,
    }


@disputes_bp.get("")
@jwt_required()
def list_disputes():
    uid = actor_user_id()
    if uid is None:
        return jsonify({"error": "Invalid session"}), 401

    status = (request.args.get("status") or "").strip().lower()
    query = DisputeCase.query
    if not is_staff():
        query = query.filter_by(user_id=uid)
    if status:
        query = query.filter(DisputeCase.status == status)

    rows = query.order_by(DisputeCase.created_at.desc()).limit(100).all()
    return jsonify([_case_dict(c) for c in rows]), 200


@disputes_bp.post("/<int:case_id>/resolve")
@jwt_required()
def resolve_dispute(case_id: int):
    if not is_staff():
        return jsonify({"error": "Staff role required"}), 403

    case = DisputeCase.query.get(case_id)
    if not case:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json() or {}
    outcome = (data.get("outcome") or "").strip().lower()
    note = (data.get("resolution_note") or data.get("note") or "").strip()[:2000]

    if outcome not in ("approved", "rejected"):
        return jsonify({"error": "outcome must be approved or rejected"}), 400

    tx = Transaction.query.get(case.transaction_id)
    if not tx:
        return jsonify({"error": "Linked transaction not found"}), 404

    case.status = outcome
    case.resolution_note = note
    if outcome == "approved":
        tx.status = "approved"
        title = "Dispute resolved in your favor"
        body = f"Transaction #{tx.id} was reviewed and marked as approved."
    else:
        tx.status = "flagged"
        title = "Dispute review completed"
        body = f"Transaction #{tx.id} remains under fraud review after analyst assessment."

    db.session.add(
        FraudNotification(
            title=title,
            body=body,
            severity="medium" if outcome == "approved" else "high",
            category="dispute_resolution",
            user_id=case.user_id,
            transaction_id=tx.id,
        )
    )
    log_action(
        actor_user_id=actor_user_id(),
        action="dispute_resolved",
        entity="dispute_case",
        entity_id=str(case.id),
        details={"outcome": outcome, "transaction_id": tx.id},
    )
    db.session.commit()
    invalidate_read_caches(case.user_id)
    return jsonify({"message": "Dispute resolved", "case": _case_dict(case)}), 200

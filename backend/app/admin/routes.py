from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models import FraudRule, Transaction, User
from ..services.admin_maintenance import (
    count_platform_records,
    delete_transaction_by_id,
    delete_user_and_related,
    purge_all_transaction_data,
)
from ..services.audit import log_action

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


def _admin():
    from flask_jwt_extended import get_jwt

    return get_jwt().get("role") == "admin"


@admin_bp.get("/users")
@jwt_required()
def list_users():
    if not _admin():
        return jsonify({"error": "Admin only"}), 403
    users = User.query.order_by(User.id.asc()).all()
    return (
        jsonify(
            [
                {
                    "id": u.id,
                    "email": u.email,
                    "role": u.role,
                    "full_name": u.full_name,
                    "is_active": u.is_active,
                    "email_verified": u.email_verified,
                }
                for u in users
            ]
        ),
        200,
    )


@admin_bp.patch("/users/<int:user_id>")
@jwt_required()
def update_user(user_id: int):
    if not _admin():
        return jsonify({"error": "Admin only"}), 403
    data = request.get_json() or {}
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Not found"}), 404
    if "role" in data and data["role"] in ("admin", "analyst", "user"):
        user.role = data["role"]
    if "is_active" in data:
        user.is_active = bool(data["is_active"])
    log_action(
        int(get_jwt_identity()) if get_jwt_identity() else None,
        "admin_update_user",
        "user",
        str(user.id),
        {"role": user.role, "is_active": user.is_active},
    )
    db.session.commit()
    return jsonify({"message": "updated"}), 200


@admin_bp.patch("/rules/<int:rule_id>")
@jwt_required()
def toggle_rule(rule_id: int):
    if not _admin():
        return jsonify({"error": "Admin only"}), 403
    rule = FraudRule.query.get(rule_id)
    if not rule:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    if "enabled" in data:
        rule.enabled = bool(data["enabled"])
    db.session.commit()
    return jsonify({"id": rule.id, "enabled": rule.enabled}), 200


@admin_bp.get("/transactions")
@jwt_required()
def list_transactions():
    if not _admin():
        return jsonify({"error": "Admin only"}), 403

    page = max(1, int(request.args.get("page", 1)))
    per_page = min(max(1, int(request.args.get("per_page", 25))), 100)
    query = Transaction.query.order_by(Transaction.id.desc())
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    pages = max(1, (total + per_page - 1) // per_page)

    return (
        jsonify(
            {
                "items": [
                    {
                        "id": t.id,
                        "user_id": t.user_id,
                        "amount": t.amount,
                        "location": t.location,
                        "merchant": t.merchant,
                        "status": t.status,
                        "risk_score": t.risk_score,
                        "created_at": t.created_at.isoformat(),
                    }
                    for t in items
                ],
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": pages,
            }
        ),
        200,
    )


@admin_bp.delete("/transactions/<int:transaction_id>")
@jwt_required()
def delete_transaction(transaction_id: int):
    if not _admin():
        return jsonify({"error": "Admin only"}), 403

    result = delete_transaction_by_id(transaction_id)
    if not result.get("deleted"):
        return jsonify({"error": "Not found"}), 404

    log_action(
        int(get_jwt_identity()),
        "admin_delete_transaction",
        "transaction",
        str(transaction_id),
        {"user_id": result.get("user_id")},
    )
    db.session.commit()
    return jsonify({"message": "Transaction deleted", **result}), 200


@admin_bp.get("/system/stats")
@jwt_required()
def system_stats():
    if not _admin():
        return jsonify({"error": "Admin only"}), 403
    return jsonify(count_platform_records()), 200


@admin_bp.delete("/users/<int:user_id>")
@jwt_required()
def delete_user(user_id: int):
    if not _admin():
        return jsonify({"error": "Admin only"}), 403

    actor_id = int(get_jwt_identity())
    if user_id == actor_id:
        return jsonify({"error": "You cannot delete your own account"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Not found"}), 404

    if user.role == "admin":
        other_admins = User.query.filter(User.role == "admin", User.id != user_id).count()
        if other_admins < 1:
            return jsonify({"error": "Cannot delete the only administrator account"}), 400

    result = delete_user_and_related(user_id)
    log_action(
        actor_id,
        "admin_delete_user",
        "user",
        str(user_id),
        {"email": result.get("email"), "transactions_removed": result["transactions_removed"]},
    )
    db.session.commit()
    return jsonify({"message": "User deleted", **result}), 200


_PURGE_CONFIRM_PHRASE = "DELETE_ALL_TRANSACTIONS"


@admin_bp.post("/data/purge-transactions")
@jwt_required()
def purge_transactions():
    if not _admin():
        return jsonify({"error": "Admin only"}), 403

    data = request.get_json() or {}
    if (data.get("confirm") or "").strip() != _PURGE_CONFIRM_PHRASE:
        return (
            jsonify(
                {
                    "error": "Confirmation required",
                    "confirm_phrase": _PURGE_CONFIRM_PHRASE,
                }
            ),
            400,
        )

    actor_id = int(get_jwt_identity())
    result = purge_all_transaction_data()
    log_action(
        actor_id,
        "admin_purge_transactions",
        "system",
        "transactions",
        result,
    )
    db.session.commit()
    return jsonify({"message": "All transaction data removed", **result}), 200


@admin_bp.post("/models/retrain")
@jwt_required()
def retrain_stub():
    if not _admin():
        return jsonify({"error": "Admin only"}), 403
    log_action(
        int(get_jwt_identity()) if get_jwt_identity() else None,
        "model_retrain_requested",
        "model",
        "fraud",
        {"status": "queued", "note": "Wire to ml/train_model.py in production"},
    )
    db.session.commit()
    return jsonify({"message": "Retrain job queued (stub)", "status": "queued"}), 202

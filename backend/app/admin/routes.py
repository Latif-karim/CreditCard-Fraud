from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models import FraudRule, User
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

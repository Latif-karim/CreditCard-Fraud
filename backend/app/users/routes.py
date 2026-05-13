from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models import User, UserSession
from ..services.audit import log_action

users_bp = Blueprint("users", __name__, url_prefix="/users")


@users_bp.get("/me")
@jwt_required()
def profile():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user:
        return jsonify({"error": "Not found"}), 404
    return (
        jsonify(
            {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "email_verified": user.email_verified,
                "two_factor_enabled": user.two_factor_enabled,
            }
        ),
        200,
    )


@users_bp.patch("/me")
@jwt_required()
def update_profile():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    if "full_name" in data:
        user.full_name = data["full_name"]
    db.session.commit()
    return jsonify({"message": "Profile updated"}), 200


@users_bp.post("/change-password")
@jwt_required()
def change_password():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    old = data.get("current_password") or ""
    new = data.get("new_password") or ""
    if len(new) < 8:
        return jsonify({"error": "Password too short"}), 400
    if not user.check_password(old):
        return jsonify({"error": "Current password incorrect"}), 400
    user.set_password(new)
    db.session.commit()
    log_action(uid, "password_changed", "user", str(uid), {})
    return jsonify({"message": "Password changed"}), 200


@users_bp.get("/sessions")
@jwt_required()
def sessions():
    uid = int(get_jwt_identity())
    rows = UserSession.query.filter_by(user_id=uid).order_by(UserSession.last_seen.desc()).all()
    if not rows:
        rows = [
            UserSession(
                user_id=uid,
                device_label="Chrome · Windows (this device)",
                ip_address="127.0.0.1",
                is_current=True,
            )
        ]
        db.session.add(rows[0])
        db.session.commit()
    return (
        jsonify(
            [
                {
                    "id": s.id,
                    "device_label": s.device_label,
                    "ip_address": s.ip_address,
                    "last_seen": s.last_seen.isoformat(),
                    "is_current": s.is_current,
                }
                for s in rows
            ]
        ),
        200,
    )


@users_bp.post("/toggle-2fa")
@jwt_required()
def toggle_2fa():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user:
        return jsonify({"error": "Not found"}), 404
    user.two_factor_enabled = not user.two_factor_enabled
    db.session.commit()
    return jsonify({"two_factor_enabled": user.two_factor_enabled}), 200

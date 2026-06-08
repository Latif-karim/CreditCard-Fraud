import secrets
from datetime import datetime, timedelta

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from ..extensions import db
from ..models import PasswordResetToken, User
from ..schemas import LoginSchema, RegisterSchema
from ..services.user_access import effective_role, requires_approval

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

_ALLOWED_REGISTER_ROLES = frozenset({"user", "analyst", "admin"})
_APPROVAL_REQUIRED_ROLES = frozenset({"analyst", "admin"})


def _requires_approval(user: User) -> bool:
    return requires_approval(user)


def _effective_role(user: User) -> str:
    return effective_role(user)


@auth_bp.post("/register")
def register():
    data = RegisterSchema().load(request.get_json() or {})
    role = (data.get("role") or "user").lower()
    if role not in _ALLOWED_REGISTER_ROLES:
        return jsonify({"error": "Invalid role for self-registration"}), 400
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already exists"}), 400

    user = User(
        email=data["email"],
        role=role,
        full_name=data.get("full_name"),
        email_verified=False,
        approved=role not in _APPROVAL_REQUIRED_ROLES,
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    awaiting_approval = _requires_approval(user)
    return (
        jsonify(
            {
                "message": (
                    "Access request submitted. You can use the cardholder workspace while an administrator reviews your request."
                    if awaiting_approval
                    else "Account created successfully. Please verify your email to activate your account."
                ),
                "awaiting_approval": awaiting_approval,
                "verification_required": True,
            }
        ),
        201,
    )


@auth_bp.post("/login")
def login():
    data = LoginSchema().load(request.get_json() or {})
    user = User.query.filter_by(email=data["email"]).first()
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    if not user.password_hash:
        return (
            jsonify(
                {
                    "error": "This account uses social sign-in. Continue with Google or GitHub.",
                    "social_login": True,
                }
            ),
            401,
        )
    if not user.check_password(data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401
    if not user.is_active:
        return jsonify({"error": "Account suspended"}), 403

    effective_role = _effective_role(user)
    token = create_access_token(identity=str(user.id), additional_claims={"role": effective_role})

    return (
        jsonify(
            {
                "access_token": token,
                "role": effective_role,
                "requested_role": user.role if _requires_approval(user) else None,
                "user_id": user.id,
                "email_verified": user.email_verified,
                "approved": user.approved,
            }
        ),
        200,
    )


@auth_bp.post("/forgot-password")
def forgot_password():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "If the email exists, instructions were sent."}), 200

    otp = f"{secrets.randbelow(900000) + 100000:06d}"
    expires = datetime.utcnow() + timedelta(minutes=15)
    db.session.add(PasswordResetToken(email=email, otp_code=otp, expires_at=expires, used=False))
    db.session.commit()

    payload = {"message": "If an account exists for this email, a verification code was sent."}
    if current_app.debug:
        payload["dev_otp"] = otp
    return jsonify(payload), 200


@auth_bp.post("/verify-otp")
def verify_otp_only():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    otp = (data.get("otp") or "").strip()
    token_row = (
        PasswordResetToken.query.filter_by(email=email, otp_code=otp, used=False)
        .order_by(PasswordResetToken.created_at.desc())
        .first()
    )
    if not token_row or token_row.expires_at < datetime.utcnow():
        return jsonify({"valid": False}), 200
    return jsonify({"valid": True}), 200


@auth_bp.post("/reset-password")
def reset_password():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    otp = (data.get("otp") or "").strip()
    new_password = data.get("new_password") or ""
    if len(new_password) < 8:
        return jsonify({"error": "Password too short"}), 400

    token_row = (
        PasswordResetToken.query.filter_by(email=email, otp_code=otp, used=False)
        .order_by(PasswordResetToken.created_at.desc())
        .first()
    )
    if not token_row or token_row.expires_at < datetime.utcnow():
        return jsonify({"error": "Invalid or expired OTP"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.set_password(new_password)
    token_row.used = True
    db.session.commit()
    return jsonify({"message": "Password updated"}), 200


@auth_bp.post("/verify-email")
@jwt_required()
def verify_email():
    """Mark the authenticated user's email as verified."""
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user:
        return jsonify({"error": "Not found"}), 404
    user.email_verified = True
    db.session.commit()
    return jsonify({"message": "Email verified"}), 200


@auth_bp.get("/me")
@jwt_required()
def me():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user:
        return jsonify({"error": "Not found"}), 404
    effective_role = _effective_role(user)
    return (
        jsonify(
            {
                "id": user.id,
                "email": user.email,
                "role": effective_role,
                "requested_role": user.role if _requires_approval(user) else None,
                "full_name": user.full_name,
                "email_verified": user.email_verified,
                "approved": user.approved,
                "two_factor_enabled": user.two_factor_enabled,
            }
        ),
        200,
    )

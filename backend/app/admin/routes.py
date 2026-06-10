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
from ..services.cache import invalidate_read_caches
from ..services.rbac import is_admin

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


def _admin():
    return is_admin()


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
                    "approved": u.approved,
                    "email_verified": u.email_verified,
                    "created_at": u.created_at.isoformat(),
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
    actor_id = int(get_jwt_identity())
    if user.id == actor_id and data.get("approved") is False:
        return jsonify({"error": "You cannot revoke your own approval"}), 400
    if "role" in data and data["role"] in ("admin", "analyst"):
        user.role = data["role"]
        user.approved = True
    if "approved" in data:
        user.approved = bool(data["approved"])
    if "is_active" in data:
        user.is_active = bool(data["is_active"])
    log_action(
        actor_id,
        "admin_update_user",
        "user",
        str(user.id),
        {"role": user.role, "is_active": user.is_active, "approved": user.approved},
    )
    db.session.commit()
    return jsonify({"message": "updated"}), 200


@admin_bp.post("/users/<int:user_id>/approve")
@jwt_required()
def approve_user(user_id: int):
    if not _admin():
        return jsonify({"error": "Admin only"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Not found"}), 404
    if user.role not in ("admin", "analyst"):
        return jsonify({"error": "Only analyst or admin requests require approval"}), 400

    user.approved = True
    log_action(
        int(get_jwt_identity()),
        "admin_approve_access",
        "user",
        str(user.id),
        {"email": user.email, "role": user.role},
    )
    db.session.commit()
    return jsonify({"message": "Access approved", "id": user.id, "approved": user.approved}), 200


@admin_bp.post("/users/<int:user_id>/reject")
@jwt_required()
def reject_user(user_id: int):
    if not _admin():
        return jsonify({"error": "Admin only"}), 403

    actor_id = int(get_jwt_identity())
    if user_id == actor_id:
        return jsonify({"error": "You cannot reject your own account"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Not found"}), 404
    if user.role not in ("admin", "analyst") or user.approved:
        return jsonify({"error": "No pending elevated access request for this user"}), 400

    requested_role = user.role
    user.approved = False
    user.is_active = False
    log_action(
        actor_id,
        "admin_reject_access",
        "user",
        str(user.id),
        {"email": user.email, "requested_role": requested_role},
    )
    db.session.commit()
    return jsonify({"message": "Access request rejected", "id": user.id, "role": user.role}), 200


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
    invalidate_read_caches()
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


@admin_bp.post("/data/reseed-realistic")
@jwt_required()
def reseed_realistic():
    if not _admin():
        return jsonify({"error": "Admin only"}), 403

    min_count = int((request.get_json() or {}).get("min_transactions", 80))
    min_count = max(20, min(500, min_count))

    from ..services.seed_data import reseed_realistic_demo_data

    actor_id = int(get_jwt_identity())
    result = reseed_realistic_demo_data(min_transactions=min_count)
    log_action(
        actor_id,
        "admin_reseed_realistic",
        "system",
        "transactions",
        result,
    )
    db.session.commit()
    invalidate_read_caches()
    return jsonify({"message": "Realistic demo dataset loaded", **result}), 200


@admin_bp.post("/models/retrain")
@jwt_required()
def retrain_models():
    if not _admin():
        return jsonify({"error": "Admin only"}), 403

    from pathlib import Path
    import subprocess
    import sys

    from ..fraud.model import reload_models

    ml_dir = Path(__file__).resolve().parents[2] / "ml"
    dataset = ml_dir / "artifacts" / "synthetic_creditcard.csv"
    train_script = ml_dir / "train_model.py"
    cmd = [sys.executable, str(train_script), "--output-dir", str(ml_dir / "artifacts")]
    if dataset.exists():
        cmd.extend(["--dataset", str(dataset)])

    try:
        completed = subprocess.run(cmd, capture_output=True, text=True, timeout=600, check=False)
        if completed.returncode != 0:
            return (
                jsonify(
                    {
                        "error": "Retrain failed",
                        "stderr": (completed.stderr or completed.stdout)[-2000:],
                    }
                ),
                500,
            )
        reload_models()
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Retrain timed out after 10 minutes"}), 504
    except OSError as exc:
        return jsonify({"error": f"Could not start retrain process: {exc}"}), 500

    from ..services.model_metrics import load_model_metrics_payload

    metrics = load_model_metrics_payload()
    log_action(
        int(get_jwt_identity()) if get_jwt_identity() else None,
        "model_retrain_completed",
        "model",
        "fraud",
        {"status": "completed", "selected_model": metrics.get("selected_model")},
    )
    db.session.commit()
    return (
        jsonify(
            {
                "message": "Deep learning models retrained successfully",
                "status": "completed",
                "metrics": metrics,
            }
        ),
        200,
    )

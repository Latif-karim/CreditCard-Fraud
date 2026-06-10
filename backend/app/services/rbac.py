"""Role-based access helpers for fraud operations API routes."""

from flask_jwt_extended import get_jwt_identity

from ..models import User
from .user_access import requires_approval


def actor_user_id() -> int | None:
    identity = get_jwt_identity()
    if identity is None:
        return None
    try:
        return int(identity)
    except (TypeError, ValueError):
        return None


def _actor_user() -> User | None:
    uid = actor_user_id()
    if uid is None:
        return None
    user = User.query.get(uid)
    if not user or not user.is_active:
        return None
    return user


def current_role() -> str | None:
    user = _actor_user()
    if not user:
        return None
    return user.role


def is_approved() -> bool:
    user = _actor_user()
    if not user:
        return False
    return not requires_approval(user)


def is_admin() -> bool:
    return is_approved() and current_role() == "admin"


def is_analyst() -> bool:
    return is_approved() and current_role() == "analyst"


def is_staff() -> bool:
    return is_approved() and current_role() in ("admin", "analyst")


def scope_transactions(query):
    """All transaction queries are global for approved fraud operations staff."""
    return query


def require_staff():
    return is_staff()


def can_manage_transaction(_tx) -> bool:
    return is_staff()

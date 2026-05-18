"""Role-based access helpers for API routes."""

from flask_jwt_extended import get_jwt, get_jwt_identity

from ..models import Transaction


def current_role() -> str | None:
    return get_jwt().get("role")


def actor_user_id() -> int | None:
    identity = get_jwt_identity()
    if identity is None:
        return None
    try:
        return int(identity)
    except (TypeError, ValueError):
        return None


def is_admin() -> bool:
    return current_role() == "admin"


def is_analyst() -> bool:
    return current_role() == "analyst"


def is_staff() -> bool:
    return current_role() in ("admin", "analyst")


def is_cardholder() -> bool:
    return current_role() == "user"


def scope_transactions(query):
    """Limit transaction queries to the signed-in cardholder when role is user."""
    if is_cardholder():
        uid = actor_user_id()
        if uid is not None:
            return query.filter(Transaction.user_id == uid)
    return query


def require_staff():
    return is_staff() or is_admin()


def can_manage_transaction(tx: Transaction) -> bool:
    if is_staff():
        return True
    uid = actor_user_id()
    return uid is not None and tx.user_id == uid

"""User role and elevated-access approval helpers."""

from __future__ import annotations

from ..models import User

APPROVAL_REQUIRED_ROLES = frozenset({"analyst", "admin"})
ALLOWED_ELEVATION_ROLES = frozenset({"analyst", "admin"})


def requires_approval(user: User) -> bool:
    return user.role in APPROVAL_REQUIRED_ROLES and not user.approved


def effective_role(user: User) -> str:
    return "user" if requires_approval(user) else user.role


def requested_role(user: User) -> str | None:
    return user.role if requires_approval(user) else None

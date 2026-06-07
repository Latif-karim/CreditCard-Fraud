"""Read enabled fraud rules from the database for runtime scoring."""

from __future__ import annotations

from ..models import FraudRule

# Defaults match seeded migration values when DB is unavailable.
_DEFAULTS = {
    "velocity_window": True,
    "high_amount": True,
    "location_mismatch": True,
    "behavior_deviation": True,
}


def enabled_rule_names() -> set[str]:
    try:
        rows = FraudRule.query.all()
        if not rows:
            return {k for k, v in _DEFAULTS.items() if v}
        return {r.name for r in rows if r.enabled}
    except Exception:
        return {k for k, v in _DEFAULTS.items() if v}


def is_rule_enabled(name: str) -> bool:
    return name in enabled_rule_names()

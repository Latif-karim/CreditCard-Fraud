"""Aggregate dashboard KPIs from persisted transaction data."""

from __future__ import annotations

from sqlalchemy import func

from ..models import FraudRule, Transaction, User
from ..services.model_metrics import load_model_metrics_payload
from ..services.rbac import is_staff, scope_transactions

_SUSPICIOUS_STATUSES = frozenset({"flagged", "disputed", "blocked", "declined", "frozen"})


def _scoped_query():
    return scope_transactions(Transaction.query)


def _aggregate_transaction_stats(base) -> dict:
    total = base.count()
    flagged = base.filter(Transaction.status == "flagged").count()
    disputed = base.filter(Transaction.status == "disputed").count()
    approved = base.filter(Transaction.status == "approved").count()
    under_review = base.filter(Transaction.status.in_(("flagged", "disputed"))).count()

    total_volume = _scalar(base.with_entities(func.coalesce(func.sum(Transaction.amount), 0.0)))
    flagged_volume = _scalar(
        base.with_entities(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
            Transaction.status.in_(tuple(_SUSPICIOUS_STATUSES))
        )
    )

    return {
        "total_transactions": total,
        "flagged_transactions": flagged,
        "disputed_transactions": disputed,
        "approved_transactions": approved,
        "under_review_transactions": under_review,
        "fraud_rate": round(flagged / total, 6) if total else 0.0,
        "review_rate": round(under_review / total, 6) if total else 0.0,
        "total_volume": round(total_volume, 2),
        "flagged_volume": round(flagged_volume, 2),
        "revenue_protected": round(flagged_volume, 2),
    }


def _health_fields() -> dict:
    return {
        "enabled_rules": FraudRule.query.filter_by(enabled=True).count(),
        "total_rules": FraudRule.query.count(),
        "active_analysts": User.query.filter(
            User.role.in_(("admin", "analyst")),
            User.is_active.is_(True),
            User.approved.is_(True),
        ).count(),
    }


def compute_overview_stats() -> dict:
    stats = _aggregate_transaction_stats(_scoped_query())
    stats["active_users"] = User.query.filter_by(is_active=True).count()
    stats["scope"] = "global"
    if is_staff():
        stats.update(_health_fields())
    return stats


def compute_platform_stats() -> dict:
    stats = _aggregate_transaction_stats(Transaction.query)
    stats["active_users"] = User.query.filter_by(is_active=True).count()
    stats.update(_health_fields())
    metrics = load_model_metrics_payload()
    stats.update(
        {
            "pr_auc": metrics.get("pr_auc"),
            "recall_fraud": metrics.get("recall_fraud"),
            "precision_at_alert": metrics.get("precision_at_alert"),
            "artifact_present": metrics.get("artifact_present"),
            "last_trained": metrics.get("last_trained"),
        }
    )
    return stats


def _scalar(query) -> float:
    row = query.first()
    return float(row[0]) if row and row[0] is not None else 0.0

import json

from ..extensions import db
from ..models import AuditLog


def log_action(actor_user_id: int | None, action: str, entity: str, entity_id: str, details: dict) -> None:
    entry = AuditLog(
        actor_user_id=actor_user_id,
        action=action,
        entity=entity,
        entity_id=entity_id,
        details=json.dumps(details),
    )
    db.session.add(entry)

from ..extensions import db
from ..models import Alert, User


def send_email_alert(transaction_id: int, user_id: int, message: str) -> None:
    # Placeholder email sender. Integrate SMTP/SendGrid in production.
    user = User.query.get(user_id)
    recipient = user.email if user else "admin@example.com"
    alert = Alert(
        transaction_id=transaction_id,
        channel="email",
        recipient=recipient,
        status="sent",
        message=message,
    )
    db.session.add(alert)

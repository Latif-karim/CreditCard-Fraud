from datetime import datetime

from .extensions import bcrypt, db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default="user", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    transactions = db.relationship("Transaction", backref="user", lazy=True)
    profile = db.relationship("UserProfile", backref="user", uselist=False, lazy=True)

    def set_password(self, raw_password: str) -> None:
        self.password_hash = bcrypt.generate_password_hash(raw_password).decode("utf-8")

    def check_password(self, raw_password: str) -> bool:
        return bcrypt.check_password_hash(self.password_hash, raw_password)


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    location = db.Column(db.String(120), nullable=False)
    merchant = db.Column(db.String(120), nullable=True)
    card_last4 = db.Column(db.String(4), nullable=True)
    status = db.Column(db.String(20), default="pending", nullable=False)
    risk_score = db.Column(db.Float, nullable=False, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    decision = db.relationship("FraudDecision", backref="transaction", uselist=False)


class FraudDecision(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(
        db.Integer, db.ForeignKey("transaction.id"), unique=True, nullable=False
    )
    rule_score = db.Column(db.Float, default=0.0, nullable=False)
    behavior_score = db.Column(db.Float, default=0.0, nullable=False)
    ml_score = db.Column(db.Float, default=0.0, nullable=False)
    ml_probability = db.Column(db.Float, default=0.0, nullable=False)
    reasons = db.Column(db.Text, nullable=False)
    final_label = db.Column(db.String(20), nullable=False, default="legit")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class UserProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), unique=True, nullable=False)
    avg_spend = db.Column(db.Float, default=0.0, nullable=False)
    top_locations = db.Column(db.Text, default="", nullable=False)
    tx_count = db.Column(db.Integer, default=0, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class Alert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey("transaction.id"), nullable=False)
    channel = db.Column(db.String(20), nullable=False, default="email")
    recipient = db.Column(db.String(120), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="sent")
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    actor_user_id = db.Column(db.Integer, nullable=True)
    action = db.Column(db.String(120), nullable=False)
    entity = db.Column(db.String(120), nullable=False)
    entity_id = db.Column(db.String(64), nullable=False)
    details = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

import os
from datetime import timedelta


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-dev-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "sqlite:///fraud_detection.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    ALERT_EMAIL_FROM = os.getenv("ALERT_EMAIL_FROM", "alerts@example.com")

"""Create or link users from OAuth provider profiles."""

from __future__ import annotations

from ..extensions import db
from ..models import User


def get_or_create_oauth_user(
    *,
    provider: str,
    subject: str,
    email: str,
    full_name: str | None,
) -> User:
    email = (email or "").strip().lower()
    if not email:
        raise ValueError("OAuth provider did not return an email address")

    subject = str(subject)
    user = User.query.filter_by(auth_provider=provider, oauth_subject=subject).first()
    if user:
        if full_name and not user.full_name:
            user.full_name = full_name
            db.session.commit()
        return user

    by_email = User.query.filter_by(email=email).first()
    if by_email:
        if by_email.oauth_subject and (
            by_email.auth_provider != provider or by_email.oauth_subject != subject
        ):
            by_email.oauth_subject = subject
            by_email.auth_provider = provider
        elif not by_email.oauth_subject:
            by_email.oauth_subject = subject
            by_email.auth_provider = provider
        by_email.email_verified = True
        if full_name and not by_email.full_name:
            by_email.full_name = full_name
        db.session.commit()
        return by_email

    user = User(
        email=email,
        role="user",
        full_name=full_name,
        email_verified=True,
        is_active=True,
        approved=True,
        auth_provider=provider,
        oauth_subject=subject,
        password_hash=None,
    )
    db.session.add(user)
    db.session.commit()
    return user

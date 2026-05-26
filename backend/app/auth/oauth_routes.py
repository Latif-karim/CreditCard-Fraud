"""
Google & GitHub OAuth (authorization code flow).

Uses plain requests + Flask session state — no Authlib, so Windows SSL issues are
controlled in one place via OAUTH_SSL_VERIFY in backend/.env.
"""

from __future__ import annotations

import logging
import secrets
from urllib.parse import urlencode

import requests
from flask import Blueprint, current_app, jsonify, redirect, request, session, url_for
from flask_jwt_extended import create_access_token

from ..extensions import db
from ..services.oauth_users import get_or_create_oauth_user
from .oauth_http import requests_verify

logger = logging.getLogger(__name__)

oauth_bp = Blueprint("oauth", __name__, url_prefix="/auth")

GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_API = "https://api.github.com"


def init_oauth(app) -> None:
    """Reserved for future setup; session-based OAuth needs no registry."""
    app.config.setdefault("SESSION_COOKIE_SAMESITE", "Lax")
    app.config.setdefault("SESSION_COOKIE_SECURE", False)


def _google_configured() -> bool:
    return bool(
        current_app.config.get("GOOGLE_CLIENT_ID")
        and current_app.config.get("GOOGLE_CLIENT_SECRET")
    )


def _github_configured() -> bool:
    return bool(
        current_app.config.get("GITHUB_CLIENT_ID")
        and current_app.config.get("GITHUB_CLIENT_SECRET")
    )


def _frontend_callback(**params: str) -> str:
    base = current_app.config["FRONTEND_URL"]
    qs = urlencode({k: v for k, v in params.items() if v is not None})
    return f"{base}/auth/callback?{qs}" if qs else f"{base}/auth/callback"


def _issue_redirect(*, user=None, error: str | None = None) -> str:
    if error:
        return _frontend_callback(error=error)
    if user is None:
        return _frontend_callback(error="oauth_failed")
    if not user.is_active:
        return _frontend_callback(error="account_suspended")
    effective_role = "user" if user.role in ("admin", "analyst") and not user.approved else user.role
    token = create_access_token(identity=str(user.id), additional_claims={"role": effective_role})
    return _frontend_callback(
        access_token=token,
        role=effective_role,
        user_id=str(user.id),
        email_verified="1" if user.email_verified else "0",
    )


def _oauth_error_code(exc: BaseException) -> str:
    if isinstance(exc, requests.exceptions.SSLError):
        return "oauth_ssl_error"
    if isinstance(exc, requests.exceptions.ConnectionError):
        return "oauth_network_error"
    return "oauth_failed"


def _new_oauth_state(provider: str) -> str:
    state = secrets.token_urlsafe(24)
    session[f"oauth_state_{provider}"] = state
    return state


def _pop_oauth_state(provider: str, received: str | None) -> bool:
    expected = session.pop(f"oauth_state_{provider}", None)
    if not expected or not received:
        return False
    return secrets.compare_digest(expected, received)


def _http() -> bool | str:
    return requests_verify(current_app)


@oauth_bp.get("/oauth/providers")
def oauth_providers():
    cfg = current_app.config
    return (
        jsonify(
            {
                "google": bool(cfg.get("GOOGLE_CLIENT_ID") and cfg.get("GOOGLE_CLIENT_SECRET")),
                "github": bool(cfg.get("GITHUB_CLIENT_ID") and cfg.get("GITHUB_CLIENT_SECRET")),
            }
        ),
        200,
    )


@oauth_bp.get("/google")
def google_login():
    if not _google_configured():
        return jsonify({"error": "Google sign-in is currently unavailable"}), 503

    redirect_uri = url_for("oauth.google_callback", _external=True)
    state = _new_oauth_state("google")
    query = urlencode(
        {
            "client_id": current_app.config["GOOGLE_CLIENT_ID"],
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "online",
            "prompt": "select_account",
        }
    )
    return redirect(f"{GOOGLE_AUTHORIZE_URL}?{query}")


@oauth_bp.get("/google/callback")
def google_callback():
    if not _google_configured():
        return redirect(_issue_redirect(error="google_not_configured"))

    if request.args.get("error"):
        logger.warning("Google OAuth denied: %s", request.args.get("error"))
        return redirect(_issue_redirect(error="oauth_failed"))

    state = request.args.get("state")
    if not _pop_oauth_state("google", state):
        logger.warning("Google OAuth state mismatch")
        return redirect(_issue_redirect(error="oauth_failed"))

    code = request.args.get("code")
    if not code:
        return redirect(_issue_redirect(error="oauth_failed"))

    redirect_uri = url_for("oauth.google_callback", _external=True)
    verify = _http()

    try:
        token_resp = requests.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": current_app.config["GOOGLE_CLIENT_ID"],
                "client_secret": current_app.config["GOOGLE_CLIENT_SECRET"],
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
            verify=verify,
            timeout=30,
        )
        token_resp.raise_for_status()
        access_token = token_resp.json().get("access_token")
        if not access_token:
            return redirect(_issue_redirect(error="oauth_failed"))

        info_resp = requests.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            verify=verify,
            timeout=30,
        )
        info_resp.raise_for_status()
        info = info_resp.json()

        user = get_or_create_oauth_user(
            provider="google",
            subject=str(info.get("sub")),
            email=info.get("email") or "",
            full_name=info.get("name"),
        )
        return redirect(_issue_redirect(user=user))
    except Exception as exc:
        logger.exception("Google OAuth callback failed")
        db.session.rollback()
        return redirect(_issue_redirect(error=_oauth_error_code(exc)))


@oauth_bp.get("/github")
def github_login():
    if not _github_configured():
        return jsonify({"error": "GitHub sign-in is currently unavailable"}), 503

    redirect_uri = url_for("oauth.github_callback", _external=True)
    state = _new_oauth_state("github")
    query = urlencode(
        {
            "client_id": current_app.config["GITHUB_CLIENT_ID"],
            "redirect_uri": redirect_uri,
            "scope": "read:user user:email",
            "state": state,
        }
    )
    return redirect(f"{GITHUB_AUTHORIZE_URL}?{query}")


@oauth_bp.get("/github/callback")
def github_callback():
    if not _github_configured():
        return redirect(_issue_redirect(error="github_not_configured"))

    if request.args.get("error"):
        return redirect(_issue_redirect(error="oauth_failed"))

    state = request.args.get("state")
    if not _pop_oauth_state("github", state):
        return redirect(_issue_redirect(error="oauth_failed"))

    code = request.args.get("code")
    if not code:
        return redirect(_issue_redirect(error="oauth_failed"))

    redirect_uri = url_for("oauth.github_callback", _external=True)
    verify = _http()
    headers = {"Accept": "application/json"}

    try:
        token_resp = requests.post(
            GITHUB_TOKEN_URL,
            data={
                "code": code,
                "client_id": current_app.config["GITHUB_CLIENT_ID"],
                "client_secret": current_app.config["GITHUB_CLIENT_SECRET"],
                "redirect_uri": redirect_uri,
            },
            headers=headers,
            verify=verify,
            timeout=30,
        )
        token_resp.raise_for_status()
        access_token = token_resp.json().get("access_token")
        if not access_token:
            return redirect(_issue_redirect(error="oauth_failed"))

        auth_header = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
        }
        profile_resp = requests.get(f"{GITHUB_API}/user", headers=auth_header, verify=verify, timeout=30)
        profile_resp.raise_for_status()
        profile = profile_resp.json()

        email = profile.get("email")
        if not email:
            emails_resp = requests.get(
                f"{GITHUB_API}/user/emails", headers=auth_header, verify=verify, timeout=30
            )
            emails_resp.raise_for_status()
            for row in emails_resp.json() or []:
                if row.get("primary") and row.get("verified"):
                    email = row.get("email")
                    break
            if not email:
                for row in emails_resp.json() or []:
                    if row.get("verified"):
                        email = row.get("email")
                        break

        user = get_or_create_oauth_user(
            provider="github",
            subject=str(profile.get("id")),
            email=email or "",
            full_name=profile.get("name") or profile.get("login"),
        )
        return redirect(_issue_redirect(user=user))
    except Exception as exc:
        logger.exception("GitHub OAuth callback failed")
        db.session.rollback()
        return redirect(_issue_redirect(error=_oauth_error_code(exc)))

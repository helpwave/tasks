import logging
import threading
from typing import Optional

import jwt
from config import (
    ALLOWED_ISSUERS,
    CLIENT_ID,
    FRONTEND_CLIENT_ID,
    IS_DEV,
    ISSUER_URI,
    LOGGER,
    PUBLIC_ISSUER_URI,
)
from fastapi import Request
from fastapi.responses import RedirectResponse
from starlette.requests import HTTPConnection

logger = logging.getLogger(LOGGER)

AUTH_COOKIE_NAME = "access_token"

_ACCEPTED_ALGORITHMS = ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"]

_jwk_client: jwt.PyJWKClient | None = None
_jwk_client_lock = threading.Lock()


def _get_jwk_client() -> jwt.PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        with _jwk_client_lock:
            if _jwk_client is None:
                jwks_uri = f"{ISSUER_URI}/protocol/openid-connect/certs"
                _jwk_client = jwt.PyJWKClient(
                    jwks_uri,
                    cache_keys=True,
                    lifespan=3600,
                    timeout=5,
                )
    return _jwk_client


def delete_auth_cookie(response):
    response.delete_cookie(
        AUTH_COOKIE_NAME,
        path="/",
        secure=True,
        httponly=True,
        samesite="lax",
    )


def get_user_payload(connection: HTTPConnection) -> Optional[dict]:
    token = get_token_source(connection)

    if not token:
        return None

    try:
        return verify_token(token)
    except Exception as e:
        logger.warning("Auth rejected: %s", e)
        return None


def verify_token(token: str) -> dict:
    signing_key = _get_jwk_client().get_signing_key_from_jwt(token)

    payload = jwt.decode(
        token,
        signing_key.key,
        algorithms=_ACCEPTED_ALGORITHMS,
        issuer=ALLOWED_ISSUERS,
        options={
            "require": ["exp", "iat", "iss"],
            "verify_exp": True,
            "verify_iat": True,
            "verify_iss": True,
            "verify_aud": False,
        },
    )

    if not payload.get("sub"):
        raise jwt.InvalidTokenError("Token is missing the 'sub' claim")

    azp = payload.get("azp")
    aud = payload.get("aud")
    if isinstance(aud, str):
        aud = [aud]
    elif aud is None:
        aud = []

    trusted_clients = {CLIENT_ID, FRONTEND_CLIENT_ID}
    if azp in trusted_clients or trusted_clients.intersection(aud):
        return payload

    raise jwt.InvalidAudienceError(
        f"Audience/AZP mismatch: azp={azp!r}, aud={aud!r}"
    )


def get_token_from_connection_params(connection_params: dict | None) -> str | None:
    if not connection_params or not isinstance(connection_params, dict):
        return None
    auth = connection_params.get("authorization") or connection_params.get(
        "Authorization"
    )
    if not auth or not isinstance(auth, str):
        return None
    parts = auth.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None


def _bearer_from_header(connection: HTTPConnection) -> str | None:
    auth_header = connection.headers.get("authorization")
    if not auth_header:
        return None
    parts = auth_header.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None


def get_token_source(connection: HTTPConnection) -> str | None:
    if hasattr(connection, "connection_params") and connection.connection_params:
        token = get_token_from_connection_params(connection.connection_params)
        if token:
            return token

    header_token = _bearer_from_header(connection)
    if header_token:
        return header_token

    if IS_DEV:
        return connection.cookies.get(AUTH_COOKIE_NAME)

    return None


class UnauthenticatedRedirect(Exception):
    def __init__(self, response=None):
        self.response = response
        super().__init__("Unauthenticated - redirect required")


async def unauthenticated_redirect_handler(
    request: Request,
    _: UnauthenticatedRedirect,
):
    redirect_uri = f"{request.base_url}callback"
    login_url = (
        f"{PUBLIC_ISSUER_URI}/protocol/openid-connect/auth"
        f"?client_id={CLIENT_ID}"
        f"&response_type=code"
        f"&scope=openid profile email organization"
        f"&redirect_uri={redirect_uri}"
    )
    return RedirectResponse(url=login_url)

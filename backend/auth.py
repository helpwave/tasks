import logging
from typing import Any, Optional

import requests
from config import (
    CLIENT_ID,
    FRONTEND_CLIENT_ID,
    ISSUER_URI,
    LOGGER,
    PUBLIC_ISSUER_URI,
)
from fastapi import Request
from fastapi.responses import RedirectResponse
from jose import jwk, jwt
from starlette.requests import HTTPConnection

logger = logging.getLogger(LOGGER)

AUTH_COOKIE_NAME = "access_token"

jwks_cache: dict[str, Any] = {}


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
        logger.warning(f"Auth failed for token: {e}")
        return None


def get_public_key(token: str) -> Any:
    global jwks_cache  # noqa: PLW0603

    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")

        if not kid:
            raise Exception("Token header missing 'kid' field")

        if kid in jwks_cache:
            return jwks_cache[kid]

        jwks_uri = f"{ISSUER_URI}/protocol/openid-connect/certs"

        try:
            response = requests.get(jwks_uri, timeout=5)
            response.raise_for_status()
            jwks = response.json()
        except Exception as net_err:
            logger.error(f"Failed to fetch JWKS from {jwks_uri}: {net_err}")
            raise Exception(
                "Could not reach authentication server to verify token",
            )

        for key_data in jwks.get("keys", []):
            if key_data.get("kid") == kid:
                key = jwk.construct(key_data)
                jwks_cache[kid] = key
                return key

        raise Exception(f"Public key (kid={kid}) not found in JWKS")

    except Exception as e:
        logger.error(f"Key retrieval error: {e}")
        raise e


def verify_token(token: str) -> dict:
    try:
        public_key = get_public_key(token)

        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )

        azp = payload.get("azp")
        aud = payload.get("aud")

        if isinstance(aud, str):
            aud = [aud]
        elif aud is None:
            aud = []

        if (azp and azp == CLIENT_ID) or azp == FRONTEND_CLIENT_ID:
            return payload

        if CLIENT_ID in aud or FRONTEND_CLIENT_ID in aud:
            return payload

        error_msg = (
            f"Audience/AZP mismatch. "
            f"Configured CLIENT_ID='{CLIENT_ID}'. "
            f"Token azp='{azp}', aud='{aud}'."
        )
        logger.warning(error_msg)
        raise Exception(error_msg)

    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.JWTError as e:
        raise Exception(f"Invalid token format or signature: {e!s}")
    except Exception as e:
        raise Exception(f"{e!s}")


def get_token_source(connection: HTTPConnection) -> str | None:
    auth_header = connection.headers.get("authorization")
    if auth_header:
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]

    return connection.cookies.get(AUTH_COOKIE_NAME)


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

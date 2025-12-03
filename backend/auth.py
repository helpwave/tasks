import logging
from typing import Any

import requests
from config import CLIENT_ID, ISSUER_URI, LOGGER, PUBLIC_ISSUER_URI
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
        samesite="none",
    )


def get_user_payload(connection: HTTPConnection) -> dict | None:
    token = get_token_source(connection)

    if not token:
        return None

    try:
        return verify_token(token)
    except Exception as e:
        logger.warning(f"Token validation failed: {e}")
        return None


def get_public_key(token: str) -> Any:
    global jwks_cache

    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")

        if not kid:
            raise Exception("Token header missing kid")

        if kid in jwks_cache:
            return jwks_cache[kid]

        jwks_uri = f"{ISSUER_URI}/protocol/openid-connect/certs"

        response = requests.get(jwks_uri, timeout=5)
        response.raise_for_status()
        jwks = response.json()

        for key_data in jwks.get("keys", []):
            if key_data.get("kid") == kid:
                key = jwk.construct(key_data)
                jwks_cache[kid] = key
                return key

        raise Exception("Public key not found in JWKS")

    except Exception as e:
        logger.error(f"Auth Error: {e}")
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

        if azp and azp == CLIENT_ID:
            return payload

        if CLIENT_ID in aud:
            return payload

        raise Exception(
            f"Invalid audience/azp. Expected {CLIENT_ID}, got azp={azp}, aud={aud}",
        )
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.JWTError as e:
        raise Exception(f"Invalid token: {e!s}")
    except Exception as e:
        raise Exception(f"Authentication failed: {e!s}")


def get_token_source(connection: HTTPConnection) -> str | None:
    auth_header = connection.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ")[1]

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
        f"&scope=openid profile email"
        f"&redirect_uri={redirect_uri}"
    )
    return RedirectResponse(url=login_url)

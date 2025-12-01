import logging
from typing import Any

import requests
from config import CLIENT_ID, ISSUER_URI, LOGGER, PUBLIC_ISSUER_URI
from fastapi import HTTPException, Request, status
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


async def authenticate_connection(connection, token: str | None):
    user_payload = None

    if token:
        try:
            user_payload = verify_token(token)
        except Exception as e:
            logger.warning(f"Token validation failed: {e}")

    if user_payload:
        return user_payload

    if connection.scope["type"] == "http":
        response = RedirectResponse("/login", status_code=302)
        delete_auth_cookie(response)

        accept_header = connection.headers.get("accept", "")

        if "text/html" in accept_header:
            raise UnauthenticatedRedirect(response=response)

        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if connection.scope["type"] == "websocket":
        raise HTTPException(status_code=403, detail="Not authenticated")

    raise RuntimeError("Unsupported connection type")


def get_public_key(token: str) -> Any:
    global jwks_cache

    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")

        if not kid:
            raise Exception("Token header missing kid")

        if kid in jwks_cache:
            return jwks_cache[kid]

        # TODO use openid config endpoint to obtain well-known endpoints in the future
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
        print(f"Auth Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


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
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e!s}")
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed")


async def get_token_source(
    connection: HTTPConnection,
) -> str | None:
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

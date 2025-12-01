from typing import Any

import requests
from config import CLIENT_ID, ISSUER_URI
from fastapi import HTTPException, status
from jose import jwk, jwt

jwks_cache: dict[str, Any] = {}
openid_config_cache: dict[str, Any] = {}


def get_openid_config() -> dict[str, Any]:
    global openid_config_cache
    if openid_config_cache:
        return openid_config_cache

    config_url = f"{ISSUER_URI.rstrip('/')}/.well-known/openid-configuration"
    try:
        response = requests.get(config_url, timeout=5)
        response.raise_for_status()
        config = response.json()
        openid_config_cache = config
        return config
    except Exception as e:
        print(f"OIDC Config Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not fetch OpenID Configuration",
        )


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

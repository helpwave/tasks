import requests
from config import CLIENT_ID, CLIENT_SECRET, ISSUER_URI
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

router = APIRouter()


@router.get("/logout")
def logout(_: Request):
    response = RedirectResponse(url="/graphql")
    response.delete_cookie(
        "access_token",
        path="/",
        secure=True,
        httponly=True,
        samesite="lax",
    )
    return response


@router.get("/callback")
def oauth_callback(code: str, request: Request):
    token_endpoint = f"{ISSUER_URI}/protocol/openid-connect/token"
    redirect_uri = f"{request.base_url}callback"

    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": redirect_uri,
    }

    try:
        response = requests.post(token_endpoint, data=payload, timeout=10)
        response.raise_for_status()
        token_data = response.json()
        access_token = token_data.get("access_token")

        resp = RedirectResponse(url="/graphql")
        resp.set_cookie(
            "access_token",
            access_token,
            httponly=True,
            max_age=3600,
            samesite="lax",
            secure=True,
        )
        return resp

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Authentication failed during token exchange",
        )

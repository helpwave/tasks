import requests
from api.context import Context
from api.resolvers import Mutation, Query, Subscription
from auth import verify_token
from config import CLIENT_ID, CLIENT_SECRET, IS_DEV, PUBLIC_ISSUER_URI, ISSUER_URI
from database.models.user import User
from database.session import get_db_session
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from strawberry import Schema
from strawberry.fastapi import GraphQLRouter

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{ISSUER_URI}/protocol/openid-connect/token",
    auto_error=False,
)


async def get_token_source(
    request: Request,
    header_token: str | None = Depends(oauth2_scheme),
) -> str | None:
    if header_token:
        return header_token

    return request.cookies.get("access_token")


class UnauthenticatedRedirect(Exception):
    pass


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


async def get_context(
    request: Request,
    token: str | None = Depends(get_token_source),
    session=Depends(get_db_session),
) -> Context:
    user_payload = None

    if token:
        try:
            user_payload = verify_token(token)
        except Exception as e:
            raise e
            user_payload = None

    if not user_payload:
        accept_header = request.headers.get("accept", "")
        if "text/html" in accept_header:
            raise UnauthenticatedRedirect
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = user_payload.get("sub")
    username = (
        user_payload.get("preferred_username")
        or user_payload.get("name")
        or "Unknown"
    )
    firstname = user_payload.get("given_name")
    lastname = user_payload.get("family_name")

    result = await session.execute(select(User).where(User.id == user_id))
    db_user = result.scalars().first()

    if not db_user:
        db_user = User(
            id=user_id,
            name=username,
            firstname=firstname,
            lastname=lastname,
            title="User",
        )
        session.add(db_user)
    else:
        db_user.name = username
        db_user.firstname = firstname
        db_user.lastname = lastname

    await session.commit()
    await session.refresh(db_user)

    return Context(db=session, user=db_user)


schema = Schema(
    query=Query,
    mutation=Mutation,
    subscription=Subscription,
)
graphql_app = GraphQLRouter(
    schema,
    context_getter=get_context,
    graphiql=IS_DEV,
)


app = FastAPI(
    title="helpwave tasks",
    docs_url="/docs" if IS_DEV else None,
    redoc_url="/redoc" if IS_DEV else None,
    openapi_url="/openapi.json" if IS_DEV else None,
)

app.add_exception_handler(
    UnauthenticatedRedirect,
    unauthenticated_redirect_handler,
)


@app.get("/callback")
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
        )
        return resp

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Authentication failed during token exchange",
        )


app.include_router(graphql_app, prefix="/graphql")

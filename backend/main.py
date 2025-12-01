import logging

import requests
from starlette.status import HTTP_400_BAD_REQUEST
from api.context import Context
from api.resolvers import Mutation, Query, Subscription
from auth import UnauthenticatedRedirect, authenticate_connection, get_token_source, unauthenticated_redirect_handler, verify_token
from config import (
    CLIENT_ID,
    CLIENT_SECRET,
    IS_DEV,
    ISSUER_URI,
    LOGGER,
)
from database.models.user import User
from database.session import get_db_session
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from starlette.requests import HTTPConnection
from strawberry import Schema
from strawberry.fastapi import GraphQLRouter

logger = logging.getLogger(LOGGER)


async def get_context(
    connection: HTTPConnection,
    token: str | None = Depends(get_token_source),
    session=Depends(get_db_session),
) -> Context:
    user_payload = await authenticate_connection(connection, token)

    user_id = user_payload.get("sub")
    username = (
        user_payload.get("preferred_username")
        or user_payload.get("name")
    )
    firstname = user_payload.get("given_name")
    lastname = user_payload.get("family_name")

    if not (user_id and username and firstname and lastname):
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="Missing required user details.")

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
    elif db_user.name != username or db_user.firstname != firstname:
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

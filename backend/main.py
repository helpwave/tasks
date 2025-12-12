import logging

from api.context import get_context
from api.extensions import GlobalAuthExtension
from api.resolvers import Mutation, Query, Subscription
from api.router import AuthedGraphQLRouter
from auth import UnauthenticatedRedirect, unauthenticated_redirect_handler
from config import ALLOWED_ORIGINS, IS_DEV, LOGGER
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth
from strawberry import Schema

logger = logging.getLogger(LOGGER)

schema = Schema(
    query=Query,
    mutation=Mutation,
    subscription=Subscription,
    extensions=[GlobalAuthExtension],
)

graphql_app = AuthedGraphQLRouter(
    schema,
    context_getter=get_context,
    graphql_ide=IS_DEV,
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

app.include_router(auth.router)
app.include_router(graphql_app, prefix="/graphql")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

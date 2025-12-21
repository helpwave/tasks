import logging
from contextlib import asynccontextmanager

from api.context import get_context
from api.extensions import GlobalAuthExtension
from api.resolvers import Mutation, Query, Subscription
from api.router import AuthedGraphQLRouter
from auth import UnauthenticatedRedirect, unauthenticated_redirect_handler
from config import ALLOWED_ORIGINS, IS_DEV, LOGGER
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth
from scaffold import load_scaffold_data
from strawberry import Schema

logger = logging.getLogger(LOGGER)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up application...")
    await load_scaffold_data()
    yield
    logger.info("Shutting down application...")


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
    lifespan=lifespan,
)

app.add_exception_handler(
    UnauthenticatedRedirect,
    unauthenticated_redirect_handler,
)

app.include_router(auth.router)
app.include_router(graphql_app, prefix="/graphql")


@app.get("/health")
async def health_check():
    return {"status": "ok"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

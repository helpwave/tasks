from api.context import Context
from api.resolvers import Mutation, Query, Subscription
from config import IS_DEV
from database.session import get_db_session
from fastapi import Depends, FastAPI
from strawberry import Schema
from strawberry.fastapi import GraphQLRouter


async def get_context(session=Depends(get_db_session)) -> Context:
    return Context(db=session)


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

app.include_router(graphql_app, prefix="/graphql")

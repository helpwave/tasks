import strawberry

from api.context import Info
from api.query.graphql_types import QueryableField
from api.query.metadata_service import load_queryable_fields


@strawberry.type
class QueryMetadataQuery:
    @strawberry.field
    async def queryable_fields(
        self, info: Info, entity: str
    ) -> list[QueryableField]:
        return await load_queryable_fields(info.context.db, entity)

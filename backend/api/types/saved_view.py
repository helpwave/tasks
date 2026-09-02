from __future__ import annotations

from typing import TYPE_CHECKING, Annotated

import strawberry

from api.context import Info
from api.inputs import SavedViewEntityType, ScopeVisibility
from api.services.scope import load_scope_location
from database.models.saved_view import SavedView as SavedViewModel

if TYPE_CHECKING:
    from api.types.location import LocationNodeType


@strawberry.type(name="SavedView")
class SavedViewType:
    id: strawberry.ID
    name: str
    base_entity_type: SavedViewEntityType
    filter_definition: str
    sort_definition: str
    parameters: str
    related_filter_definition: str
    related_sort_definition: str
    related_parameters: str
    owner_user_id: strawberry.ID
    location_id: strawberry.ID | None
    visibility: ScopeVisibility
    created_at: str
    updated_at: str
    is_owner: bool

    @strawberry.field
    async def location(
        self,
        info: Info,
    ) -> (
        Annotated["LocationNodeType", strawberry.lazy("api.types.location")]
        | None
    ):
        return await load_scope_location(info, self.location_id)

    @staticmethod
    def from_model(
        row: SavedViewModel,
        *,
        current_user_id: str | None,
    ) -> "SavedViewType":
        return SavedViewType(
            id=strawberry.ID(row.id),
            name=row.name,
            base_entity_type=SavedViewEntityType(row.base_entity_type),
            filter_definition=row.filter_definition,
            sort_definition=row.sort_definition,
            parameters=row.parameters,
            related_filter_definition=row.related_filter_definition,
            related_sort_definition=row.related_sort_definition,
            related_parameters=row.related_parameters,
            owner_user_id=strawberry.ID(row.owner_user_id),
            location_id=(
                strawberry.ID(row.location_id) if row.location_id else None
            ),
            visibility=ScopeVisibility(row.visibility),
            created_at=row.created_at.isoformat() if row.created_at else "",
            updated_at=row.updated_at.isoformat() if row.updated_at else "",
            is_owner=current_user_id is not None and row.owner_user_id == current_user_id,
        )

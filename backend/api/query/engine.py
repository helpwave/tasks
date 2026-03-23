from typing import Any

import strawberry
from sqlalchemy import Select

from api.inputs import PaginationInput
from api.query.inputs import QueryFilterClauseInput, QuerySearchInput, QuerySortClauseInput
from api.query.property_sql import load_property_field_types
from api.query.registry import get_entity_handler


def _property_ids_from_filters(
    filters: list[QueryFilterClauseInput] | None,
) -> set[str]:
    ids: set[str] = set()
    if not filters:
        return ids
    for f in filters:
        if f.field_key.startswith("property_"):
            ids.add(f.field_key.removeprefix("property_"))
    return ids


def _property_ids_from_sorts(
    sorts: list[QuerySortClauseInput] | None,
) -> set[str]:
    ids: set[str] = set()
    if not sorts:
        return ids
    for s in sorts:
        if s.field_key.startswith("property_"):
            ids.add(s.field_key.removeprefix("property_"))
    return ids


async def apply_unified_query(
    stmt: Select[Any],
    *,
    entity: str,
    db: Any,
    filters: list[QueryFilterClauseInput] | None,
    sorts: list[QuerySortClauseInput] | None,
    search: QuerySearchInput | None,
    pagination: PaginationInput | None,
    for_count: bool = False,
) -> Select[Any]:
    handler = get_entity_handler(entity)
    if not handler:
        return stmt

    prop_ids = _property_ids_from_filters(filters) | _property_ids_from_sorts(sorts)
    property_field_types = await load_property_field_types(db, prop_ids)

    ctx: dict[str, Any] = {"needs_distinct": False}

    for clause in filters or []:
        stmt = handler["apply_filter"](stmt, clause, ctx, property_field_types)

    if search is not None and search is not strawberry.UNSET:
        text = (search.search_text or "").strip()
        if text:
            stmt = handler["apply_search"](stmt, search, ctx)

    if not for_count:
        stmt = handler["apply_sorts"](stmt, sorts, ctx, property_field_types)

    if ctx.get("needs_distinct"):
        stmt = stmt.distinct(handler["root_model"].id)

    if (
        not for_count
        and pagination is not None
        and pagination is not strawberry.UNSET
    ):
        page_size = pagination.page_size
        if page_size:
            offset = pagination.page_index * page_size
            stmt = stmt.offset(offset).limit(page_size)

    return stmt

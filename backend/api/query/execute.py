from functools import wraps
from typing import Any, Callable

import strawberry
from sqlalchemy import Select, func, select

from api.context import Info
from api.inputs import PaginationInput
from api.query.engine import apply_unified_query
from api.query.inputs import QueryFilterClauseInput, QuerySearchInput, QuerySortClauseInput


def unified_list_query(
    entity: str,
    *,
    default_sorts_when_empty: list[QuerySortClauseInput] | None = None,
):
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            filters: list[QueryFilterClauseInput] | None = kwargs.get("filters")
            sorts: list[QuerySortClauseInput] | None = kwargs.get("sorts")
            if (not sorts) and default_sorts_when_empty:
                sorts = list(default_sorts_when_empty)
            search: QuerySearchInput | None = kwargs.get("search")
            pagination: PaginationInput | None = kwargs.get("pagination")

            result = await func(*args, **kwargs)

            if not isinstance(result, Select):
                return result

            info: Info | None = kwargs.get("info")
            if not info:
                for a in args:
                    if hasattr(a, "context"):
                        info = a
                        break
            if not info or not hasattr(info, "context"):
                return result

            stmt = await apply_unified_query(
                result,
                entity=entity,
                db=info.context.db,
                filters=filters,
                sorts=sorts,
                search=search,
                pagination=pagination,
                for_count=False,
            )

            db = info.context.db
            query_result = await db.execute(stmt)
            return query_result.scalars().all()

        return wrapper

    return decorator


async def count_unified_query(
    stmt: Select[Any],
    *,
    entity: str,
    db: Any,
    filters: list[QueryFilterClauseInput] | None,
    sorts: list[QuerySortClauseInput] | None,
    search: QuerySearchInput | None,
) -> int:
    stmt = await apply_unified_query(
        stmt,
        entity=entity,
        db=db,
        filters=filters,
        sorts=sorts,
        search=search,
        pagination=None,
        for_count=True,
    )
    subquery = stmt.subquery()
    count_query = select(func.count(func.distinct(subquery.c.id)))
    result = await db.execute(count_query)
    return result.scalar() or 0


def is_unset(value: Any) -> bool:
    return value is strawberry.UNSET or value is None

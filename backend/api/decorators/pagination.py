from functools import wraps
from typing import Any, Callable, TypeVar

from sqlalchemy import Select

T = TypeVar("T")


def apply_pagination(
    query: Select[Any],
    limit: int | None = None,
    offset: int | None = None,
) -> Select[Any]:
    if offset is not None:
        query = query.offset(offset)
    if limit is not None:
        query = query.limit(limit)
    return query


def paginated_query(
    limit_param: str = "limit",
    offset_param: str = "offset",
):
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            limit = kwargs.get(limit_param)
            offset = kwargs.get(offset_param)

            result = await func(*args, **kwargs)

            if isinstance(result, Select):
                return apply_pagination(result, limit=limit, offset=offset)

            return result

        return wrapper

    return decorator

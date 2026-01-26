from functools import wraps
from typing import Any, Callable, TypeVar

import strawberry
from api.inputs import FullTextSearchInput
from database import models
from database.models.base import Base
from sqlalchemy import Select, String, and_, inspect, or_
from sqlalchemy.orm import aliased

T = TypeVar("T")


def detect_entity_type(model_class: type[Base]) -> str | None:
    if model_class == models.Patient:
        return "patient"
    if model_class == models.Task:
        return "task"
    return None


def get_text_columns_from_model(model_class: type[Base]) -> list[str]:
    mapper = inspect(model_class)
    text_columns = []
    for column in mapper.columns:
        if isinstance(column.type, String):
            text_columns.append(column.key)
    return text_columns


def apply_full_text_search(
    query: Select[Any],
    search_input: FullTextSearchInput,
    model_class: type[Base],
) -> Select[Any]:
    if not search_input.search_text or not search_input.search_text.strip():
        return query

    search_text = search_input.search_text.strip()
    search_pattern = f"%{search_text}%"

    search_conditions = []

    columns_to_search = search_input.search_columns
    if columns_to_search is None:
        columns_to_search = get_text_columns_from_model(model_class)

    for column_name in columns_to_search:
        try:
            column = getattr(model_class, column_name)
            search_conditions.append(column.ilike(search_pattern))
        except AttributeError:
            continue

    if search_input.include_properties:
        entity_type = detect_entity_type(model_class)
        if entity_type:
            property_alias = aliased(models.PropertyValue)

            if entity_type == "patient":
                join_condition = property_alias.patient_id == model_class.id
            else:
                join_condition = property_alias.task_id == model_class.id

            if search_input.property_definition_ids:
                property_filter = and_(
                    property_alias.text_value.ilike(search_pattern),
                    property_alias.definition_id.in_(search_input.property_definition_ids),
                )
            else:
                property_filter = property_alias.text_value.ilike(search_pattern)

            query = query.outerjoin(property_alias, join_condition)
            search_conditions.append(property_filter)

    if not search_conditions:
        return query

    combined_condition = or_(*search_conditions)
    query = query.where(combined_condition)

    if search_input.include_properties:
        query = query.distinct()

    return query


def full_text_search_query(search_param: str = "search"):
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            search_input: FullTextSearchInput | None = kwargs.get(search_param)

            result = await func(*args, **kwargs)

            if not isinstance(result, Select):
                return result

            if not search_input or search_input is strawberry.UNSET:
                return result

            model_class = result.column_descriptions[0]["entity"]
            if not model_class:
                return result

            result = apply_full_text_search(result, search_input, model_class)

            return result

        return wrapper

    return decorator

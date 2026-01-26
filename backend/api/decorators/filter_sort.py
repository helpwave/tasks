from datetime import date as date_type
from functools import wraps
from typing import Any, Callable, TypeVar

import strawberry
from api.decorators.pagination import apply_pagination
from api.inputs import (
    ColumnType,
    FilterInput,
    FilterOperator,
    PaginationInput,
    SortDirection,
    SortInput,
)
from database import models
from database.models.base import Base
from sqlalchemy import Select, and_, func, or_, select
from sqlalchemy.orm import aliased

T = TypeVar("T")


def detect_entity_type(model_class: type[Base]) -> str | None:
    if model_class == models.Patient:
        return "patient"
    if model_class == models.Task:
        return "task"
    return None


def get_property_value_column(field_type: str) -> str:
    field_type_mapping = {
        "FIELD_TYPE_TEXT": "text_value",
        "FIELD_TYPE_NUMBER": "number_value",
        "FIELD_TYPE_CHECKBOX": "boolean_value",
        "FIELD_TYPE_DATE": "date_value",
        "FIELD_TYPE_DATE_TIME": "date_time_value",
        "FIELD_TYPE_SELECT": "select_value",
        "FIELD_TYPE_MULTI_SELECT": "multi_select_values",
    }
    return field_type_mapping.get(field_type, "text_value")


def get_property_join_alias(
    query: Select[Any],
    model_class: type[Base],
    property_definition_id: str,
    field_type: str,
) -> Any:
    entity_type = detect_entity_type(model_class)
    if not entity_type:
        raise ValueError(f"Unsupported entity type for property filtering: {model_class}")

    property_alias = aliased(models.PropertyValue)
    value_column = get_property_value_column(field_type)

    if entity_type == "patient":
        join_condition = and_(
            property_alias.patient_id == model_class.id,
            property_alias.definition_id == property_definition_id,
        )
    else:
        join_condition = and_(
            property_alias.task_id == model_class.id,
            property_alias.definition_id == property_definition_id,
        )

    query = query.outerjoin(property_alias, join_condition)
    return query, property_alias, getattr(property_alias, value_column)


def apply_sorting(
    query: Select[Any],
    sorting: list[SortInput] | None,
    model_class: type[Base],
    property_field_types: dict[str, str] | None = None,
) -> Select[Any]:
    if not sorting:
        return query

    order_by_clauses = []
    property_field_types = property_field_types or {}

    for sort_input in sorting:
        if sort_input.column_type == ColumnType.DIRECT_ATTRIBUTE:
            try:
                column = getattr(model_class, sort_input.column)
                if sort_input.direction == SortDirection.DESC:
                    order_by_clauses.append(column.desc())
                else:
                    order_by_clauses.append(column.asc())
            except AttributeError:
                continue

        elif sort_input.column_type == ColumnType.PROPERTY:
            if not sort_input.property_definition_id:
                continue

            field_type = property_field_types.get(
                sort_input.property_definition_id, "FIELD_TYPE_TEXT"
            )
            query, property_alias, value_column = get_property_join_alias(
                query, model_class, sort_input.property_definition_id, field_type
            )

            if sort_input.direction == SortDirection.DESC:
                order_by_clauses.append(value_column.desc().nulls_last())
            else:
                order_by_clauses.append(value_column.asc().nulls_first())

    if order_by_clauses:
        query = query.order_by(*order_by_clauses)

    return query


def apply_text_filter(column: Any, operator: FilterOperator, parameter: Any) -> Any:
    search_text = parameter.search_text
    if search_text is None:
        return None

    if operator == FilterOperator.TEXT_EQUALS:
        return column.ilike(search_text)
    if operator == FilterOperator.TEXT_NOT_EQUALS:
        return ~column.ilike(search_text)
    if operator == FilterOperator.TEXT_NOT_WHITESPACE:
        return func.trim(column) != ""
    if operator == FilterOperator.TEXT_CONTAINS:
        return column.ilike(f"%{search_text}%")
    if operator == FilterOperator.TEXT_NOT_CONTAINS:
        return ~column.ilike(f"%{search_text}%")
    if operator == FilterOperator.TEXT_STARTS_WITH:
        return column.ilike(f"{search_text}%")
    if operator == FilterOperator.TEXT_ENDS_WITH:
        return column.ilike(f"%{search_text}")

    return None


def apply_number_filter(column: Any, operator: FilterOperator, parameter: Any) -> Any:
    compare_value = parameter.compare_value
    min_value = parameter.min
    max_value = parameter.max

    if operator == FilterOperator.NUMBER_EQUALS:
        if compare_value is not None:
            return column == compare_value
    elif operator == FilterOperator.NUMBER_NOT_EQUALS:
        if compare_value is not None:
            return column != compare_value
    elif operator == FilterOperator.NUMBER_GREATER_THAN:
        if compare_value is not None:
            return column > compare_value
    elif operator == FilterOperator.NUMBER_GREATER_THAN_OR_EQUAL:
        if compare_value is not None:
            return column >= compare_value
    elif operator == FilterOperator.NUMBER_LESS_THAN:
        if compare_value is not None:
            return column < compare_value
    elif operator == FilterOperator.NUMBER_LESS_THAN_OR_EQUAL:
        if compare_value is not None:
            return column <= compare_value
    elif operator == FilterOperator.NUMBER_BETWEEN:
        if min_value is not None and max_value is not None:
            return column.between(min_value, max_value)
    elif operator == FilterOperator.NUMBER_NOT_BETWEEN:
        if min_value is not None and max_value is not None:
            return ~column.between(min_value, max_value)

    return None


def normalize_date_for_comparison(date_value: Any) -> Any:
    return date_value


def apply_date_filter(column: Any, operator: FilterOperator, parameter: Any) -> Any:
    compare_date = parameter.compare_date
    min_date = parameter.min_date
    max_date = parameter.max_date

    if operator == FilterOperator.DATE_EQUALS:
        if compare_date is not None:
            if isinstance(compare_date, date_type):
                return func.date(column) == compare_date
            return column == compare_date
    elif operator == FilterOperator.DATE_NOT_EQUALS:
        if compare_date is not None:
            if isinstance(compare_date, date_type):
                return func.date(column) != compare_date
            return column != compare_date
    elif operator == FilterOperator.DATE_GREATER_THAN:
        if compare_date is not None:
            if isinstance(compare_date, date_type):
                return func.date(column) > compare_date
            return column > compare_date
    elif operator == FilterOperator.DATE_GREATER_THAN_OR_EQUAL:
        if compare_date is not None:
            if isinstance(compare_date, date_type):
                return func.date(column) >= compare_date
            return column >= compare_date
    elif operator == FilterOperator.DATE_LESS_THAN:
        if compare_date is not None:
            if isinstance(compare_date, date_type):
                return func.date(column) < compare_date
            return column < compare_date
    elif operator == FilterOperator.DATE_LESS_THAN_OR_EQUAL:
        if compare_date is not None:
            if isinstance(compare_date, date_type):
                return func.date(column) <= compare_date
            return column <= compare_date
    elif operator == FilterOperator.DATE_BETWEEN:
        if min_date is not None and max_date is not None:
            if isinstance(min_date, date_type) and isinstance(max_date, date_type):
                return func.date(column).between(min_date, max_date)
            return column.between(min_date, max_date)
    elif operator == FilterOperator.DATE_NOT_BETWEEN:
        if min_date is not None and max_date is not None:
            if isinstance(min_date, date_type) and isinstance(max_date, date_type):
                return ~func.date(column).between(min_date, max_date)
            return ~column.between(min_date, max_date)

    return None


def apply_datetime_filter(
    column: Any, operator: FilterOperator, parameter: Any
) -> Any:
    compare_date_time = parameter.compare_date_time
    min_date_time = parameter.min_date_time
    max_date_time = parameter.max_date_time

    if operator == FilterOperator.DATETIME_EQUALS:
        if compare_date_time is not None:
            return column == compare_date_time
    elif operator == FilterOperator.DATETIME_NOT_EQUALS:
        if compare_date_time is not None:
            return column != compare_date_time
    elif operator == FilterOperator.DATETIME_GREATER_THAN:
        if compare_date_time is not None:
            return column > compare_date_time
    elif operator == FilterOperator.DATETIME_GREATER_THAN_OR_EQUAL:
        if compare_date_time is not None:
            return column >= compare_date_time
    elif operator == FilterOperator.DATETIME_LESS_THAN:
        if compare_date_time is not None:
            return column < compare_date_time
    elif operator == FilterOperator.DATETIME_LESS_THAN_OR_EQUAL:
        if compare_date_time is not None:
            return column <= compare_date_time
    elif operator == FilterOperator.DATETIME_BETWEEN:
        if min_date_time is not None and max_date_time is not None:
            return column.between(min_date_time, max_date_time)
    elif operator == FilterOperator.DATETIME_NOT_BETWEEN:
        if min_date_time is not None and max_date_time is not None:
            return ~column.between(min_date_time, max_date_time)

    return None


def apply_boolean_filter(column: Any, operator: FilterOperator, parameter: Any) -> Any:
    if operator == FilterOperator.BOOLEAN_IS_TRUE:
        return column.is_(True)
    if operator == FilterOperator.BOOLEAN_IS_FALSE:
        return column.is_(False)
    return None


def apply_tags_filter(column: Any, operator: FilterOperator, parameter: Any) -> Any:
    search_tags = parameter.search_tags
    if not search_tags:
        return None

    if operator == FilterOperator.TAGS_EQUALS:
        tags_str = ",".join(sorted(search_tags))
        return column == tags_str
    if operator == FilterOperator.TAGS_NOT_EQUALS:
        tags_str = ",".join(sorted(search_tags))
        return column != tags_str
    if operator == FilterOperator.TAGS_CONTAINS:
        conditions = []
        for tag in search_tags:
            conditions.append(column.contains(tag))
        return and_(*conditions)
    if operator == FilterOperator.TAGS_NOT_CONTAINS:
        conditions = []
        for tag in search_tags:
            conditions.append(~column.contains(tag))
        return or_(*conditions)

    return None


def apply_tags_single_filter(
    column: Any, operator: FilterOperator, parameter: Any
) -> Any:
    search_tags = parameter.search_tags
    if not search_tags:
        return None

    if operator == FilterOperator.TAGS_SINGLE_EQUALS:
        if len(search_tags) == 1:
            return column == search_tags[0]
    if operator == FilterOperator.TAGS_SINGLE_NOT_EQUALS:
        if len(search_tags) == 1:
            return column != search_tags[0]
    if operator == FilterOperator.TAGS_SINGLE_CONTAINS:
        conditions = []
        for tag in search_tags:
            conditions.append(column == tag)
        return or_(*conditions)
    if operator == FilterOperator.TAGS_SINGLE_NOT_CONTAINS:
        conditions = []
        for tag in search_tags:
            conditions.append(column != tag)
        return and_(*conditions)

    return None


def apply_null_filter(column: Any, operator: FilterOperator, parameter: Any) -> Any:
    if operator == FilterOperator.IS_NULL:
        return column.is_(None)
    if operator == FilterOperator.IS_NOT_NULL:
        return column.isnot(None)
    return None


def apply_filtering(
    query: Select[Any],
    filtering: list[FilterInput] | None,
    model_class: type[Base],
    property_field_types: dict[str, str] | None = None,
) -> Select[Any]:
    if not filtering:
        return query

    filter_conditions = []
    property_field_types = property_field_types or {}

    for filter_input in filtering:
        condition = None

        if filter_input.column_type == ColumnType.DIRECT_ATTRIBUTE:
            try:
                column = getattr(model_class, filter_input.column)
            except AttributeError:
                continue

            operator = filter_input.operator
            parameter = filter_input.parameter

            if operator in [
                FilterOperator.TEXT_EQUALS,
                FilterOperator.TEXT_NOT_EQUALS,
                FilterOperator.TEXT_NOT_WHITESPACE,
                FilterOperator.TEXT_CONTAINS,
                FilterOperator.TEXT_NOT_CONTAINS,
                FilterOperator.TEXT_STARTS_WITH,
                FilterOperator.TEXT_ENDS_WITH,
            ]:
                condition = apply_text_filter(column, operator, parameter)

            elif operator in [
                FilterOperator.NUMBER_EQUALS,
                FilterOperator.NUMBER_NOT_EQUALS,
                FilterOperator.NUMBER_GREATER_THAN,
                FilterOperator.NUMBER_GREATER_THAN_OR_EQUAL,
                FilterOperator.NUMBER_LESS_THAN,
                FilterOperator.NUMBER_LESS_THAN_OR_EQUAL,
                FilterOperator.NUMBER_BETWEEN,
                FilterOperator.NUMBER_NOT_BETWEEN,
            ]:
                condition = apply_number_filter(column, operator, parameter)

            elif operator in [
                FilterOperator.DATE_EQUALS,
                FilterOperator.DATE_NOT_EQUALS,
                FilterOperator.DATE_GREATER_THAN,
                FilterOperator.DATE_GREATER_THAN_OR_EQUAL,
                FilterOperator.DATE_LESS_THAN,
                FilterOperator.DATE_LESS_THAN_OR_EQUAL,
                FilterOperator.DATE_BETWEEN,
                FilterOperator.DATE_NOT_BETWEEN,
            ]:
                condition = apply_date_filter(column, operator, parameter)

            elif operator in [
                FilterOperator.DATETIME_EQUALS,
                FilterOperator.DATETIME_NOT_EQUALS,
                FilterOperator.DATETIME_GREATER_THAN,
                FilterOperator.DATETIME_GREATER_THAN_OR_EQUAL,
                FilterOperator.DATETIME_LESS_THAN,
                FilterOperator.DATETIME_LESS_THAN_OR_EQUAL,
                FilterOperator.DATETIME_BETWEEN,
                FilterOperator.DATETIME_NOT_BETWEEN,
            ]:
                condition = apply_datetime_filter(column, operator, parameter)

            elif operator in [
                FilterOperator.BOOLEAN_IS_TRUE,
                FilterOperator.BOOLEAN_IS_FALSE,
            ]:
                condition = apply_boolean_filter(column, operator, parameter)

            elif operator in [
                FilterOperator.IS_NULL,
                FilterOperator.IS_NOT_NULL,
            ]:
                condition = apply_null_filter(column, operator, parameter)

        elif filter_input.column_type == ColumnType.PROPERTY:
            if not filter_input.property_definition_id:
                continue

            field_type = property_field_types.get(
                filter_input.property_definition_id, "FIELD_TYPE_TEXT"
            )
            query, property_alias, value_column = get_property_join_alias(
                query, model_class, filter_input.property_definition_id, field_type
            )

            operator = filter_input.operator
            parameter = filter_input.parameter

            if operator in [
                FilterOperator.TEXT_EQUALS,
                FilterOperator.TEXT_NOT_EQUALS,
                FilterOperator.TEXT_NOT_WHITESPACE,
                FilterOperator.TEXT_CONTAINS,
                FilterOperator.TEXT_NOT_CONTAINS,
                FilterOperator.TEXT_STARTS_WITH,
                FilterOperator.TEXT_ENDS_WITH,
            ]:
                condition = apply_text_filter(value_column, operator, parameter)

            elif operator in [
                FilterOperator.NUMBER_EQUALS,
                FilterOperator.NUMBER_NOT_EQUALS,
                FilterOperator.NUMBER_GREATER_THAN,
                FilterOperator.NUMBER_GREATER_THAN_OR_EQUAL,
                FilterOperator.NUMBER_LESS_THAN,
                FilterOperator.NUMBER_LESS_THAN_OR_EQUAL,
                FilterOperator.NUMBER_BETWEEN,
                FilterOperator.NUMBER_NOT_BETWEEN,
            ]:
                condition = apply_number_filter(value_column, operator, parameter)

            elif operator in [
                FilterOperator.DATE_EQUALS,
                FilterOperator.DATE_NOT_EQUALS,
                FilterOperator.DATE_GREATER_THAN,
                FilterOperator.DATE_GREATER_THAN_OR_EQUAL,
                FilterOperator.DATE_LESS_THAN,
                FilterOperator.DATE_LESS_THAN_OR_EQUAL,
                FilterOperator.DATE_BETWEEN,
                FilterOperator.DATE_NOT_BETWEEN,
            ]:
                condition = apply_date_filter(value_column, operator, parameter)

            elif operator in [
                FilterOperator.DATETIME_EQUALS,
                FilterOperator.DATETIME_NOT_EQUALS,
                FilterOperator.DATETIME_GREATER_THAN,
                FilterOperator.DATETIME_GREATER_THAN_OR_EQUAL,
                FilterOperator.DATETIME_LESS_THAN,
                FilterOperator.DATETIME_LESS_THAN_OR_EQUAL,
                FilterOperator.DATETIME_BETWEEN,
                FilterOperator.DATETIME_NOT_BETWEEN,
            ]:
                condition = apply_datetime_filter(value_column, operator, parameter)

            elif operator in [
                FilterOperator.BOOLEAN_IS_TRUE,
                FilterOperator.BOOLEAN_IS_FALSE,
            ]:
                condition = apply_boolean_filter(value_column, operator, parameter)

            elif operator in [
                FilterOperator.TAGS_EQUALS,
                FilterOperator.TAGS_NOT_EQUALS,
                FilterOperator.TAGS_CONTAINS,
                FilterOperator.TAGS_NOT_CONTAINS,
            ]:
                condition = apply_tags_filter(value_column, operator, parameter)

            elif operator in [
                FilterOperator.TAGS_SINGLE_EQUALS,
                FilterOperator.TAGS_SINGLE_NOT_EQUALS,
                FilterOperator.TAGS_SINGLE_CONTAINS,
                FilterOperator.TAGS_SINGLE_NOT_CONTAINS,
            ]:
                condition = apply_tags_single_filter(value_column, operator, parameter)

            elif operator in [
                FilterOperator.IS_NULL,
                FilterOperator.IS_NOT_NULL,
            ]:
                condition = apply_null_filter(value_column, operator, parameter)

        if condition is not None:
            filter_conditions.append(condition)

    if filter_conditions:
        query = query.where(and_(*filter_conditions))

    return query


def filtered_and_sorted_query(
    filtering_param: str = "filtering",
    sorting_param: str = "sorting",
    pagination_param: str = "pagination",
):
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            filtering: list[FilterInput] | None = kwargs.get(filtering_param)
            sorting: list[SortInput] | None = kwargs.get(sorting_param)
            pagination: PaginationInput | None = kwargs.get(pagination_param)

            result = await func(*args, **kwargs)

            if not isinstance(result, Select):
                return result

            model_class = result.column_descriptions[0]["entity"]
            if not model_class:
                if isinstance(result, Select):
                    for arg in args:
                        if hasattr(arg, "context") and hasattr(arg.context, "db"):
                            db = arg.context.db
                            query_result = await db.execute(result)
                            return query_result.scalars().all()
                    else:
                        info = kwargs.get("info")
                        if info and hasattr(info, "context") and hasattr(info.context, "db"):
                            db = info.context.db
                            query_result = await db.execute(result)
                            return query_result.scalars().all()
                return result

            property_field_types: dict[str, str] = {}

            if filtering or sorting:
                property_def_ids = set()
                if filtering:
                    for f in filtering:
                        if (
                            f.column_type == ColumnType.PROPERTY
                            and f.property_definition_id
                        ):
                            property_def_ids.add(f.property_definition_id)
                if sorting:
                    for s in sorting:
                        if (
                            s.column_type == ColumnType.PROPERTY
                            and s.property_definition_id
                        ):
                            property_def_ids.add(s.property_definition_id)

                if property_def_ids:
                    for arg in args:
                        if hasattr(arg, "context") and hasattr(arg.context, "db"):
                            db = arg.context.db
                            prop_defs_result = await db.execute(
                                select(models.PropertyDefinition).where(
                                    models.PropertyDefinition.id.in_(property_def_ids)
                                )
                            )
                            prop_defs = prop_defs_result.scalars().all()
                            property_field_types = {
                                str(prop_def.id): prop_def.field_type for prop_def in prop_defs
                            }
                            break
                    else:
                        info = kwargs.get("info")
                        if info and hasattr(info, "context") and hasattr(info.context, "db"):
                            db = info.context.db
                            prop_defs_result = await db.execute(
                                select(models.PropertyDefinition).where(
                                    models.PropertyDefinition.id.in_(property_def_ids)
                                )
                            )
                            prop_defs = prop_defs_result.scalars().all()
                            property_field_types = {
                                str(prop_def.id): prop_def.field_type for prop_def in prop_defs
                            }

            if filtering:
                result = apply_filtering(
                    result, filtering, model_class, property_field_types
                )

            if sorting:
                result = apply_sorting(
                    result, sorting, model_class, property_field_types
                )

            if pagination and pagination is not strawberry.UNSET:
                page_index = pagination.page_index
                page_size = pagination.page_size
                if page_size:
                    offset = page_index * page_size
                    result = apply_pagination(result, limit=page_size, offset=offset)

            if isinstance(result, Select):
                for arg in args:
                    if hasattr(arg, "context") and hasattr(arg.context, "db"):
                        db = arg.context.db
                        query_result = await db.execute(result)
                        return query_result.scalars().all()
                else:
                    info = kwargs.get("info")
                    if info and hasattr(info, "context") and hasattr(info.context, "db"):
                        db = info.context.db
                        query_result = await db.execute(result)
                        return query_result.scalars().all()

            return result

        return wrapper

    return decorator

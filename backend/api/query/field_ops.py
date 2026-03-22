from datetime import date, datetime
from typing import Any

from sqlalchemy import String, and_, cast, func, not_, or_
from sqlalchemy.sql import ColumnElement

from api.query.enums import QueryOperator
from api.query.inputs import QueryFilterValueInput


def _str_norm(v: QueryFilterValueInput) -> str | None:
    if v.string_value is not None:
        return v.string_value
    return None


def apply_ops_to_column(
    column: Any,
    operator: QueryOperator,
    value: QueryFilterValueInput | None,
    *,
    as_date: bool = False,
    as_datetime: bool = False,
) -> ColumnElement[bool] | None:
    if operator in (QueryOperator.IS_NULL, QueryOperator.IS_NOT_NULL):
        if operator == QueryOperator.IS_NULL:
            return column.is_(None)
        return column.isnot(None)

    if value is None and operator not in (
        QueryOperator.IS_EMPTY,
        QueryOperator.IS_NOT_EMPTY,
    ):
        return None

    if operator == QueryOperator.IS_EMPTY:
        return or_(column.is_(None), cast(column, String) == "")
    if operator == QueryOperator.IS_NOT_EMPTY:
        return and_(column.isnot(None), cast(column, String) != "")

    if as_date:
        return _apply_date_ops(column, operator, value)
    if as_datetime:
        return _apply_datetime_ops(column, operator, value)

    if operator == QueryOperator.EQ:
        if value is None:
            return None
        if value.uuid_value is not None:
            return column == value.uuid_value
        if value.string_value is not None:
            return column == value.string_value
        if value.float_value is not None:
            return column == value.float_value
        if value.int_value is not None:
            return column == value.int_value
        if value.bool_value is not None:
            return column == value.bool_value
        if value.date_value is not None:
            return func.date(column) == value.date_value
        if value.date_time_value is not None:
            return column == value.date_time_value
        return None

    if operator == QueryOperator.NEQ:
        if value is None:
            return None
        if value.uuid_value is not None:
            return column != value.uuid_value
        if value.string_value is not None:
            return column != value.string_value
        if value.float_value is not None:
            return column != value.float_value
        if value.bool_value is not None:
            return column != value.bool_value
        return None

    if operator == QueryOperator.GT:
        return _cmp(column, value, lambda c, x: c > x)
    if operator == QueryOperator.GTE:
        return _cmp(column, value, lambda c, x: c >= x)
    if operator == QueryOperator.LT:
        return _cmp(column, value, lambda c, x: c < x)
    if operator == QueryOperator.LTE:
        return _cmp(column, value, lambda c, x: c <= x)

    if operator == QueryOperator.BETWEEN:
        if value is None:
            return None
        if value.date_min is not None and value.date_max is not None:
            return func.date(column).between(value.date_min, value.date_max)
        if value.float_min is not None and value.float_max is not None:
            return column.between(value.float_min, value.float_max)
        return None

    if operator == QueryOperator.IN:
        if value and value.string_values:
            return column.in_(value.string_values)
        if value and value.uuid_values:
            return column.in_(value.uuid_values)
        return None

    if operator == QueryOperator.NOT_IN:
        if value and value.string_values:
            return column.notin_(value.string_values)
        if value and value.uuid_values:
            return column.notin_(value.uuid_values)
        return None

    if operator == QueryOperator.CONTAINS:
        s = _str_norm(value) if value else None
        if s is None:
            return None
        return column.ilike(f"%{s}%")
    if operator == QueryOperator.STARTS_WITH:
        s = _str_norm(value) if value else None
        if s is None:
            return None
        return column.ilike(f"{s}%")
    if operator == QueryOperator.ENDS_WITH:
        s = _str_norm(value) if value else None
        if s is None:
            return None
        return column.ilike(f"%{s}")

    if operator == QueryOperator.ANY_EQ:
        if value and value.string_values:
            return or_(*[column == t for t in value.string_values])
        return None

    if operator in (QueryOperator.ANY_IN, QueryOperator.ALL_IN, QueryOperator.NONE_IN):
        return _apply_multi_select_ops(column, operator, value)

    return None


def _cmp(column: Any, value: QueryFilterValueInput | None, pred) -> ColumnElement[bool] | None:
    if value is None:
        return None
    if value.float_value is not None:
        return pred(column, value.float_value)
    if value.int_value is not None:
        return pred(column, value.int_value)
    if value.date_value is not None:
        return pred(func.date(column), value.date_value)
    if value.date_time_value is not None:
        return pred(column, value.date_time_value)
    return None


def _apply_date_ops(
    column: Any, operator: QueryOperator, value: QueryFilterValueInput | None
) -> ColumnElement[bool] | None:
    if value is None:
        return None
    dc = func.date(column)
    if operator == QueryOperator.EQ and value.date_value is not None:
        return dc == value.date_value
    if operator == QueryOperator.NEQ and value.date_value is not None:
        return dc != value.date_value
    if operator == QueryOperator.GT and value.date_value is not None:
        return dc > value.date_value
    if operator == QueryOperator.GTE and value.date_value is not None:
        return dc >= value.date_value
    if operator == QueryOperator.LT and value.date_value is not None:
        return dc < value.date_value
    if operator == QueryOperator.LTE and value.date_value is not None:
        return dc <= value.date_value
    if (
        operator == QueryOperator.BETWEEN
        and value.date_min is not None
        and value.date_max is not None
    ):
        return dc.between(value.date_min, value.date_max)
    if operator == QueryOperator.IN and value.string_values:
        return dc.in_(value.string_values)
    return None


def _apply_datetime_ops(
    column: Any, operator: QueryOperator, value: QueryFilterValueInput | None
) -> ColumnElement[bool] | None:
    if value is None:
        return None
    if operator == QueryOperator.EQ and value.date_time_value is not None:
        return column == value.date_time_value
    if operator == QueryOperator.NEQ and value.date_time_value is not None:
        return column != value.date_time_value
    if operator == QueryOperator.GT and value.date_time_value is not None:
        return column > value.date_time_value
    if operator == QueryOperator.GTE and value.date_time_value is not None:
        return column >= value.date_time_value
    if operator == QueryOperator.LT and value.date_time_value is not None:
        return column < value.date_time_value
    if operator == QueryOperator.LTE and value.date_time_value is not None:
        return column <= value.date_time_value
    if (
        operator == QueryOperator.BETWEEN
        and value.date_min is not None
        and value.date_max is not None
    ):
        return func.date(column).between(value.date_min, value.date_max)
    return None


def _apply_multi_select_ops(
    column: Any, operator: QueryOperator, value: QueryFilterValueInput | None
) -> ColumnElement[bool] | None:
    if value is None or not value.string_values:
        return None
    tags = value.string_values
    if operator == QueryOperator.ANY_IN:
        return or_(*[column.contains(tag) for tag in tags])
    if operator == QueryOperator.ALL_IN:
        return and_(*[column.contains(tag) for tag in tags])
    if operator == QueryOperator.NONE_IN:
        return and_(*[not_(column.contains(tag)) for tag in tags])
    return None

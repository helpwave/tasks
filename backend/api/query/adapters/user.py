from typing import Any

from sqlalchemy import Select, or_

from api.inputs import SortDirection
from api.query.enums import QueryOperator, QueryableFieldKind, QueryableValueType
from api.query.field_ops import apply_ops_to_column
from api.query.graphql_types import QueryableField, sort_directions_for
from api.query.inputs import QueryFilterClauseInput, QuerySearchInput, QuerySortClauseInput
from api.query.sql_expr import user_display_label_expr
from database import models


def apply_user_filter_clause(
    query: Select[Any],
    clause: QueryFilterClauseInput,
    ctx: dict[str, Any],
    property_field_types: dict[str, str],
) -> Select[Any]:
    key = clause.field_key
    op = clause.operator
    val = clause.value

    if key == "username":
        c = apply_ops_to_column(models.User.username, op, val)
        if c is not None:
            query = query.where(c)
        return query
    if key == "email":
        c = apply_ops_to_column(models.User.email, op, val)
        if c is not None:
            query = query.where(c)
        return query
    if key == "firstname":
        c = apply_ops_to_column(models.User.firstname, op, val)
        if c is not None:
            query = query.where(c)
        return query
    if key == "lastname":
        c = apply_ops_to_column(models.User.lastname, op, val)
        if c is not None:
            query = query.where(c)
        return query
    if key == "name":
        expr = user_display_label_expr(models.User)
        c = apply_ops_to_column(expr, op, val)
        if c is not None:
            query = query.where(c)
        return query
    return query


def apply_user_sorts(
    query: Select[Any],
    sorts: list[QuerySortClauseInput] | None,
    ctx: dict[str, Any],
    property_field_types: dict[str, str],
) -> Select[Any]:
    if not sorts:
        return query.order_by(models.User.id.asc())

    order_parts: list[Any] = []
    for s in sorts:
        key = s.field_key
        desc_order = s.direction == SortDirection.DESC
        if key == "username":
            order_parts.append(
                models.User.username.desc()
                if desc_order
                else models.User.username.asc()
            )
        elif key == "email":
            order_parts.append(
                models.User.email.desc().nulls_last()
                if desc_order
                else models.User.email.asc().nulls_first()
            )
        elif key == "name":
            expr = user_display_label_expr(models.User)
            order_parts.append(
                expr.desc().nulls_last() if desc_order else expr.asc().nulls_first()
            )
    order_parts.append(models.User.id.asc())
    return query.order_by(*order_parts)


def apply_user_search(
    query: Select[Any],
    search: QuerySearchInput | None,
    ctx: dict[str, Any],
) -> Select[Any]:
    if not search or not search.search_text or not search.search_text.strip():
        return query
    pattern = f"%{search.search_text.strip()}%"
    expr = user_display_label_expr(models.User)
    query = query.where(
        or_(
            models.User.username.ilike(pattern),
            models.User.email.ilike(pattern),
            expr.ilike(pattern),
        )
    )
    return query


def build_user_queryable_fields_static() -> list[QueryableField]:
    str_ops = [
        QueryOperator.EQ,
        QueryOperator.NEQ,
        QueryOperator.CONTAINS,
        QueryOperator.STARTS_WITH,
        QueryOperator.ENDS_WITH,
        QueryOperator.IS_NULL,
        QueryOperator.IS_NOT_NULL,
    ]
    return [
        QueryableField(
            key="username",
            label="Username",
            kind=QueryableFieldKind.SCALAR,
            value_type=QueryableValueType.STRING,
            allowed_operators=str_ops,
            sortable=True,
            sort_directions=sort_directions_for(True),
            searchable=True,
        ),
        QueryableField(
            key="email",
            label="Email",
            kind=QueryableFieldKind.SCALAR,
            value_type=QueryableValueType.STRING,
            allowed_operators=str_ops,
            sortable=True,
            sort_directions=sort_directions_for(True),
            searchable=True,
        ),
        QueryableField(
            key="name",
            label="Name",
            kind=QueryableFieldKind.SCALAR,
            value_type=QueryableValueType.STRING,
            allowed_operators=str_ops,
            sortable=True,
            sort_directions=sort_directions_for(True),
            searchable=True,
        ),
    ]

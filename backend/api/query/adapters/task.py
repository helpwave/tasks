from typing import Any

from sqlalchemy import Select, and_, case, func, or_, select
from sqlalchemy.orm import aliased

from api.inputs import SortDirection
from api.query.enums import (
    QueryOperator,
    QueryableFieldKind,
    QueryableValueType,
    ReferenceFilterMode,
)
from api.query.field_ops import apply_ops_to_column
from api.query.graphql_types import QueryableChoiceMeta, QueryableField, QueryableRelationMeta
from api.query.inputs import (
    QueryFilterClauseInput,
    QuerySearchInput,
    QuerySortClauseInput,
)
from api.query.property_sql import join_property_value
from api.query.sql_expr import location_title_expr, patient_display_name_expr, user_display_label_expr
from database import models


def _prio_order_case() -> Any:
    return case(
        (models.Task.priority == "P1", 1),
        (models.Task.priority == "P2", 2),
        (models.Task.priority == "P3", 3),
        (models.Task.priority == "P4", 4),
        else_=99,
    )


def _ensure_assignee_join(query: Select[Any], ctx: dict[str, Any]) -> tuple[Select[Any], Any]:
    if "assignee_user" in ctx:
        return query, ctx["assignee_user"]
    u = aliased(models.User)
    ctx["assignee_user"] = u
    query = query.outerjoin(u, models.Task.assignee_id == u.id)
    ctx["needs_distinct"] = True
    return query, u


def _ensure_team_join(query: Select[Any], ctx: dict[str, Any]) -> tuple[Select[Any], Any]:
    if "assignee_team" in ctx:
        return query, ctx["assignee_team"]
    ln = aliased(models.LocationNode)
    ctx["assignee_team"] = ln
    query = query.outerjoin(ln, models.Task.assignee_team_id == ln.id)
    ctx["needs_distinct"] = True
    return query, ln


def _parse_property_key(field_key: str) -> str | None:
    if not field_key.startswith("property_"):
        return None
    return field_key.removeprefix("property_")


def apply_task_filter_clause(
    query: Select[Any],
    clause: QueryFilterClauseInput,
    ctx: dict[str, Any],
    property_field_types: dict[str, str],
) -> Select[Any]:
    key = clause.field_key
    op = clause.operator
    val = clause.value

    prop_id = _parse_property_key(key)
    if prop_id:
        ft = property_field_types.get(prop_id, "FIELD_TYPE_TEXT")
        ent = "task"
        query, _pa, col = join_property_value(
            query, models.Task, prop_id, ft, ent
        )
        ctx["needs_distinct"] = True
        ctx.setdefault("property_joins", set()).add(prop_id)
        if ft == "FIELD_TYPE_MULTI_SELECT":
            if op in (
                QueryOperator.IN,
                QueryOperator.ANY_IN,
                QueryOperator.ALL_IN,
                QueryOperator.NONE_IN,
            ):
                cond = apply_ops_to_column(col, op, val)
            else:
                cond = apply_ops_to_column(col, op, val, as_date=False)
        elif ft == "FIELD_TYPE_DATE":
            cond = apply_ops_to_column(col, op, val, as_date=True)
        elif ft == "FIELD_TYPE_DATE_TIME":
            cond = apply_ops_to_column(col, op, val, as_datetime=True)
        elif ft == "FIELD_TYPE_CHECKBOX":
            if op == QueryOperator.EQ and val and val.bool_value is not None:
                cond = col == val.bool_value
            else:
                cond = apply_ops_to_column(col, op, val)
        elif ft == "FIELD_TYPE_USER":
            cond = apply_ops_to_column(col, op, val)
        elif ft == "FIELD_TYPE_SELECT":
            cond = apply_ops_to_column(col, op, val)
        else:
            cond = apply_ops_to_column(col, op, val)
        if cond is not None:
            query = query.where(cond)
        return query

    if key == "title":
        c = apply_ops_to_column(models.Task.title, op, val)
        if c is not None:
            query = query.where(c)
        return query
    if key == "description":
        c = apply_ops_to_column(models.Task.description, op, val)
        if c is not None:
            query = query.where(c)
        return query
    if key == "done":
        if op == QueryOperator.EQ and val and val.bool_value is not None:
            query = query.where(models.Task.done == val.bool_value)
        elif op == QueryOperator.IS_NULL:
            query = query.where(models.Task.done.is_(None))
        elif op == QueryOperator.IS_NOT_NULL:
            query = query.where(models.Task.done.isnot(None))
        return query
    if key == "dueDate":
        c = apply_ops_to_column(models.Task.due_date, op, val, as_datetime=True)
        if c is not None:
            query = query.where(c)
        return query
    if key == "priority":
        c = apply_ops_to_column(models.Task.priority, op, val)
        if c is not None:
            query = query.where(c)
        return query
    if key == "estimatedTime":
        c = apply_ops_to_column(models.Task.estimated_time, op, val)
        if c is not None:
            query = query.where(c)
        return query
    if key == "creationDate":
        c = apply_ops_to_column(models.Task.creation_date, op, val, as_datetime=True)
        if c is not None:
            query = query.where(c)
        return query
    if key == "updateDate":
        c = apply_ops_to_column(models.Task.update_date, op, val, as_datetime=True)
        if c is not None:
            query = query.where(c)
        return query

    if key == "assignee":
        query, u = _ensure_assignee_join(query, ctx)
        label = user_display_label_expr(u)
        if op in (QueryOperator.EQ, QueryOperator.IN) and val and (
            val.uuid_value or val.uuid_values
        ):
            if val.uuid_value:
                query = query.where(models.Task.assignee_id == val.uuid_value)
            elif val.uuid_values:
                query = query.where(models.Task.assignee_id.in_(val.uuid_values))
        elif op in (
            QueryOperator.CONTAINS,
            QueryOperator.STARTS_WITH,
            QueryOperator.ENDS_WITH,
        ):
            c = apply_ops_to_column(label, op, val)
            if c is not None:
                query = query.where(c)
        elif op in (QueryOperator.IS_NULL, QueryOperator.IS_NOT_NULL):
            c = apply_ops_to_column(models.Task.assignee_id, op, None)
            if c is not None:
                query = query.where(c)
        return query

    if key == "assigneeTeam":
        query, ln = _ensure_team_join(query, ctx)
        expr = location_title_expr(ln)
        if op in (QueryOperator.EQ, QueryOperator.IN) and val and val.uuid_value:
            query = query.where(models.Task.assignee_team_id == val.uuid_value)
        elif op in (
            QueryOperator.CONTAINS,
            QueryOperator.STARTS_WITH,
            QueryOperator.ENDS_WITH,
        ):
            c = apply_ops_to_column(expr, op, val)
            if c is not None:
                query = query.where(c)
        elif op in (QueryOperator.IS_NULL, QueryOperator.IS_NOT_NULL):
            c = apply_ops_to_column(models.Task.assignee_team_id, op, None)
            if c is not None:
                query = query.where(c)
        return query

    if key == "patient":
        p = models.Patient
        expr = patient_display_name_expr(p)
        if op in (QueryOperator.EQ, QueryOperator.IN) and val and (
            val.uuid_value or val.uuid_values
        ):
            if val.uuid_value:
                query = query.where(models.Task.patient_id == val.uuid_value)
            elif val.uuid_values:
                query = query.where(models.Task.patient_id.in_(val.uuid_values))
        elif op in (
            QueryOperator.CONTAINS,
            QueryOperator.STARTS_WITH,
            QueryOperator.ENDS_WITH,
        ):
            c = apply_ops_to_column(expr, op, val)
            if c is not None:
                query = query.where(c)
        return query

    return query


def apply_task_sorts(
    query: Select[Any],
    sorts: list[QuerySortClauseInput] | None,
    ctx: dict[str, Any],
    property_field_types: dict[str, str],
) -> Select[Any]:
    if not sorts:
        return query.order_by(models.Task.id.asc())

    order_parts: list[Any] = []

    for s in sorts:
        key = s.field_key
        desc_order = s.direction == SortDirection.DESC
        prop_id = _parse_property_key(key)
        if prop_id:
            ft = property_field_types.get(prop_id, "FIELD_TYPE_TEXT")
            query, _pa, col = join_property_value(
                query, models.Task, prop_id, ft, "task"
            )
            ctx["needs_distinct"] = True
            if desc_order:
                order_parts.append(col.desc().nulls_last())
            else:
                order_parts.append(col.asc().nulls_first())
            continue

        if key == "title":
            order_parts.append(
                models.Task.title.desc() if desc_order else models.Task.title.asc()
            )
        elif key == "description":
            order_parts.append(
                models.Task.description.desc()
                if desc_order
                else models.Task.description.asc()
            )
        elif key == "done":
            order_parts.append(
                models.Task.done.desc() if desc_order else models.Task.done.asc()
            )
        elif key == "dueDate":
            order_parts.append(
                models.Task.due_date.desc().nulls_last()
                if desc_order
                else models.Task.due_date.asc().nulls_first()
            )
        elif key == "priority":
            order_parts.append(
                _prio_order_case().desc()
                if desc_order
                else _prio_order_case().asc()
            )
        elif key == "estimatedTime":
            order_parts.append(
                models.Task.estimated_time.desc().nulls_last()
                if desc_order
                else models.Task.estimated_time.asc().nulls_first()
            )
        elif key == "creationDate":
            order_parts.append(
                models.Task.creation_date.desc().nulls_last()
                if desc_order
                else models.Task.creation_date.asc().nulls_first()
            )
        elif key == "updateDate":
            order_parts.append(
                models.Task.update_date.desc().nulls_last()
                if desc_order
                else models.Task.update_date.asc().nulls_first()
            )
        elif key == "assignee":
            query, u = _ensure_assignee_join(query, ctx)
            label = user_display_label_expr(u)
            order_parts.append(
                label.desc().nulls_last() if desc_order else label.asc().nulls_first()
            )
        elif key == "assigneeTeam":
            query, ln = _ensure_team_join(query, ctx)
            t = location_title_expr(ln)
            order_parts.append(
                t.desc().nulls_last() if desc_order else t.asc().nulls_first()
            )
        elif key == "patient":
            expr = patient_display_name_expr(models.Patient)
            order_parts.append(
                expr.desc().nulls_last() if desc_order else expr.asc().nulls_first()
            )

    order_parts.append(models.Task.id.asc())
    return query.order_by(*order_parts)


def apply_task_search(
    query: Select[Any],
    search: QuerySearchInput | None,
    ctx: dict[str, Any],
) -> Select[Any]:
    if not search or not search.search_text or not search.search_text.strip():
        return query
    pattern = f"%{search.search_text.strip()}%"
    query, u = _ensure_assignee_join(query, ctx)
    parts: list[Any] = [
        models.Task.title.ilike(pattern),
        models.Task.description.ilike(pattern),
        patient_display_name_expr(models.Patient).ilike(pattern),
        user_display_label_expr(u).ilike(pattern),
    ]
    if search.include_properties:
        pv = aliased(models.PropertyValue)
        query = query.outerjoin(
            pv,
            and_(
                pv.task_id == models.Task.id,
                pv.text_value.isnot(None),
            ),
        )
        parts.append(pv.text_value.ilike(pattern))
        ctx["needs_distinct"] = True
    query = query.where(or_(*parts))
    return query


def build_task_queryable_fields_static() -> list[QueryableField]:
    prio_ops = [
        QueryOperator.EQ,
        QueryOperator.NEQ,
        QueryOperator.IN,
        QueryOperator.NOT_IN,
        QueryOperator.IS_NULL,
        QueryOperator.IS_NOT_NULL,
    ]
    ref_ops = [
        QueryOperator.EQ,
        QueryOperator.IN,
        QueryOperator.CONTAINS,
        QueryOperator.STARTS_WITH,
        QueryOperator.ENDS_WITH,
        QueryOperator.IS_NULL,
        QueryOperator.IS_NOT_NULL,
    ]
    str_ops = [
        QueryOperator.EQ,
        QueryOperator.NEQ,
        QueryOperator.CONTAINS,
        QueryOperator.STARTS_WITH,
        QueryOperator.ENDS_WITH,
        QueryOperator.IN,
        QueryOperator.NOT_IN,
        QueryOperator.IS_NULL,
        QueryOperator.IS_NOT_NULL,
    ]
    num_ops = [
        QueryOperator.EQ,
        QueryOperator.NEQ,
        QueryOperator.GT,
        QueryOperator.GTE,
        QueryOperator.LT,
        QueryOperator.LTE,
        QueryOperator.BETWEEN,
        QueryOperator.IS_NULL,
        QueryOperator.IS_NOT_NULL,
    ]
    dt_ops = [
        QueryOperator.EQ,
        QueryOperator.NEQ,
        QueryOperator.GT,
        QueryOperator.GTE,
        QueryOperator.LT,
        QueryOperator.LTE,
        QueryOperator.BETWEEN,
        QueryOperator.IS_NULL,
        QueryOperator.IS_NOT_NULL,
    ]
    bool_ops = [QueryOperator.EQ, QueryOperator.IS_NULL, QueryOperator.IS_NOT_NULL]

    return [
        QueryableField(
            key="title",
            label="Title",
            kind=QueryableFieldKind.SCALAR,
            value_type=QueryableValueType.STRING,
            allowed_operators=str_ops,
            sortable=True,
            searchable=True,
        ),
        QueryableField(
            key="description",
            label="Description",
            kind=QueryableFieldKind.SCALAR,
            value_type=QueryableValueType.STRING,
            allowed_operators=str_ops,
            sortable=True,
            searchable=True,
        ),
        QueryableField(
            key="done",
            label="Done",
            kind=QueryableFieldKind.SCALAR,
            value_type=QueryableValueType.BOOLEAN,
            allowed_operators=bool_ops,
            sortable=True,
            searchable=False,
        ),
        QueryableField(
            key="dueDate",
            label="Due date",
            kind=QueryableFieldKind.SCALAR,
            value_type=QueryableValueType.DATETIME,
            allowed_operators=dt_ops,
            sortable=True,
            searchable=False,
        ),
        QueryableField(
            key="priority",
            label="Priority",
            kind=QueryableFieldKind.CHOICE,
            value_type=QueryableValueType.STRING,
            allowed_operators=prio_ops,
            sortable=True,
            searchable=False,
            choice=QueryableChoiceMeta(
                option_keys=["P1", "P2", "P3", "P4"],
                option_labels=["P1", "P2", "P3", "P4"],
            ),
        ),
        QueryableField(
            key="estimatedTime",
            label="Estimated time",
            kind=QueryableFieldKind.SCALAR,
            value_type=QueryableValueType.NUMBER,
            allowed_operators=num_ops,
            sortable=True,
            searchable=False,
        ),
        QueryableField(
            key="creationDate",
            label="Creation date",
            kind=QueryableFieldKind.SCALAR,
            value_type=QueryableValueType.DATETIME,
            allowed_operators=dt_ops,
            sortable=True,
            searchable=False,
        ),
        QueryableField(
            key="updateDate",
            label="Update date",
            kind=QueryableFieldKind.SCALAR,
            value_type=QueryableValueType.DATETIME,
            allowed_operators=dt_ops,
            sortable=True,
            searchable=False,
        ),
        QueryableField(
            key="patient",
            label="Patient",
            kind=QueryableFieldKind.REFERENCE,
            value_type=QueryableValueType.UUID,
            allowed_operators=ref_ops,
            sortable=True,
            searchable=True,
            relation=QueryableRelationMeta(
                target_entity="Patient",
                id_field_key="id",
                label_field_key="name",
                allowed_filter_modes=[
                    ReferenceFilterMode.ID,
                    ReferenceFilterMode.LABEL,
                ],
            ),
        ),
        QueryableField(
            key="assignee",
            label="Assignee",
            kind=QueryableFieldKind.REFERENCE,
            value_type=QueryableValueType.UUID,
            allowed_operators=ref_ops,
            sortable=True,
            searchable=True,
            relation=QueryableRelationMeta(
                target_entity="User",
                id_field_key="id",
                label_field_key="name",
                allowed_filter_modes=[
                    ReferenceFilterMode.ID,
                    ReferenceFilterMode.LABEL,
                ],
            ),
        ),
        QueryableField(
            key="assigneeTeam",
            label="Assignee team",
            kind=QueryableFieldKind.REFERENCE,
            value_type=QueryableValueType.UUID,
            allowed_operators=ref_ops,
            sortable=True,
            searchable=False,
            relation=QueryableRelationMeta(
                target_entity="LocationNode",
                id_field_key="id",
                label_field_key="title",
                allowed_filter_modes=[
                    ReferenceFilterMode.ID,
                    ReferenceFilterMode.LABEL,
                ],
            ),
        ),
    ]

from typing import Any

from sqlalchemy import Select, and_, case, func, or_
from sqlalchemy.orm import aliased

from api.context import Info
from api.errors import raise_forbidden
from api.inputs import PatientState, Sex, SortDirection
from api.query.enums import (
    QueryOperator,
    QueryableFieldKind,
    QueryableValueType,
    ReferenceFilterMode,
)
from api.query.field_ops import apply_ops_to_column
from api.query.graphql_types import (
    QueryableChoiceMeta,
    QueryableField,
    QueryableRelationMeta,
    sort_directions_for,
)
from api.query.inputs import QueryFilterClauseInput, QuerySearchInput, QuerySortClauseInput
from api.query.property_sql import join_property_value
from api.query.patient_location_scope import (
    apply_patient_subtree_filter_from_cte,
    build_location_descendants_cte,
)
from api.query.sql_expr import location_title_expr, patient_display_name_expr
from database import models


def _state_order_case() -> Any:
    return case(
        (models.Patient.state == PatientState.WAIT.value, 0),
        (models.Patient.state == PatientState.ADMITTED.value, 1),
        (models.Patient.state == PatientState.DISCHARGED.value, 2),
        (models.Patient.state == PatientState.DEAD.value, 3),
        else_=4,
    )


def _ensure_position_join(query: Select[Any], ctx: dict[str, Any]) -> tuple[Select[Any], Any]:
    if "position_node" in ctx:
        return query, ctx["position_node"]
    ln = aliased(models.LocationNode)
    ctx["position_node"] = ln
    query = query.outerjoin(ln, models.Patient.position_id == ln.id)
    return query, ln


def _parse_property_key(field_key: str) -> str | None:
    if not field_key.startswith("property_"):
        return None
    return field_key.removeprefix("property_")


LOCATION_SORT_KEY_KINDS: dict[str, tuple[str, ...]] = {
    "location-CLINIC": ("CLINIC", "PRACTICE"),
    "location-WARD": ("WARD",),
    "location-ROOM": ("ROOM",),
    "location-BED": ("BED",),
}


LOCATION_SORT_KEY_LABELS: dict[str, str] = {
    "location-CLINIC": "Clinic",
    "location-WARD": "Ward",
    "location-ROOM": "Room",
    "location-BED": "Bed",
}


def _ensure_position_lineage_joins(
    query: Select[Any], ctx: dict[str, Any]
) -> tuple[Select[Any], list[Any]]:
    if "position_lineage_nodes" in ctx:
        return query, ctx["position_lineage_nodes"]
    query, position_node = _ensure_position_join(query, ctx)
    lineage_nodes: list[Any] = [position_node]
    for depth in range(1, 8):
        parent_node = aliased(models.LocationNode, name=f"position_parent_{depth}")
        query = query.outerjoin(parent_node, lineage_nodes[-1].parent_id == parent_node.id)
        lineage_nodes.append(parent_node)
    ctx["position_lineage_nodes"] = lineage_nodes
    return query, lineage_nodes


def _location_title_for_kind(lineage_nodes: list[Any], target_kinds: tuple[str, ...]) -> Any:
    candidates = [
        case(
            (node.kind.in_(target_kinds), location_title_expr(node)),
            else_=None,
        )
        for node in lineage_nodes
    ]
    return func.coalesce(*candidates)


def apply_patient_filter_clause(
    query: Select[Any],
    clause: QueryFilterClauseInput,
    ctx: dict[str, Any],
    property_field_types: dict[str, str],
    info: Info | None = None,
) -> Select[Any]:
    key = clause.field_key
    op = clause.operator
    val = clause.value

    prop_id = _parse_property_key(key)
    if prop_id:
        ft = property_field_types.get(prop_id, "FIELD_TYPE_TEXT")
        query, _pa, col = join_property_value(
            query, models.Patient, prop_id, ft, "patient"
        )
        ctx["needs_distinct"] = True
        if ft == "FIELD_TYPE_MULTI_SELECT":
            cond = apply_ops_to_column(col, op, val)
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

    if key == "firstname":
        c = apply_ops_to_column(models.Patient.firstname, op, val)
        if c is not None:
            query = query.where(c)
        return query
    if key == "lastname":
        c = apply_ops_to_column(models.Patient.lastname, op, val)
        if c is not None:
            query = query.where(c)
        return query
    if key == "name":
        expr = patient_display_name_expr(models.Patient)
        c = apply_ops_to_column(expr, op, val)
        if c is not None:
            query = query.where(c)
        return query
    if key == "state":
        c = apply_ops_to_column(models.Patient.state, op, val)
        if c is not None:
            query = query.where(c)
        return query
    if key == "sex":
        c = apply_ops_to_column(models.Patient.sex, op, val)
        if c is not None:
            query = query.where(c)
        return query
    if key == "birthdate":
        c = apply_ops_to_column(models.Patient.birthdate, op, val, as_date=True)
        if c is not None:
            query = query.where(c)
        return query
    if key == "description":
        c = apply_ops_to_column(models.Patient.description, op, val)
        if c is not None:
            query = query.where(c)
        return query
    if key in LOCATION_SORT_KEY_KINDS:
        query, lineage_nodes = _ensure_position_lineage_joins(query, ctx)
        expr = _location_title_for_kind(
            lineage_nodes, LOCATION_SORT_KEY_KINDS[key]
        )
        c = apply_ops_to_column(expr, op, val)
        if c is not None:
            query = query.where(c)
        return query
    if key == "position":
        if op in (QueryOperator.EQ, QueryOperator.IN) and val:
            has_uuid = (val.uuid_value is not None and val.uuid_value != "") or (
                val.uuid_values is not None and len(val.uuid_values) > 0
            )
            if has_uuid:
                if not info or not hasattr(info, "context"):
                    return query.where(False)
                accessible = getattr(info.context, "_accessible_location_ids", None)
                if accessible is None:
                    return query.where(False)
                if op == QueryOperator.EQ:
                    if not val.uuid_value:
                        return query
                    lid = val.uuid_value
                    if lid not in accessible:
                        raise_forbidden()
                    filter_cte = build_location_descendants_cte(
                        [lid], cte_name="filter_loc_subtree"
                    )
                    ctx["needs_distinct"] = True
                    return apply_patient_subtree_filter_from_cte(query, filter_cte)
                if op == QueryOperator.IN:
                    ids: list[str] = []
                    if val.uuid_values:
                        ids = [x for x in val.uuid_values if x in accessible]
                    elif val.uuid_value and val.uuid_value in accessible:
                        ids = [val.uuid_value]
                    if not ids:
                        return query.where(False)
                    filter_cte = build_location_descendants_cte(
                        ids, cte_name="filter_loc_subtree_m"
                    )
                    ctx["needs_distinct"] = True
                    return apply_patient_subtree_filter_from_cte(query, filter_cte)
        query, ln = _ensure_position_join(query, ctx)
        expr = location_title_expr(ln)
        if op in (
            QueryOperator.CONTAINS,
            QueryOperator.STARTS_WITH,
            QueryOperator.ENDS_WITH,
        ):
            c = apply_ops_to_column(expr, op, val)
            if c is not None:
                query = query.where(c)
            return query
        if op in (QueryOperator.IS_NULL, QueryOperator.IS_NOT_NULL):
            c = apply_ops_to_column(models.Patient.position_id, op, None)
            if c is not None:
                query = query.where(c)
            return query
        return query

    return query


def apply_patient_sorts(
    query: Select[Any],
    sorts: list[QuerySortClauseInput] | None,
    ctx: dict[str, Any],
    property_field_types: dict[str, str],
) -> Select[Any]:
    if not sorts:
        return query.order_by(models.Patient.id.asc())

    order_parts: list[Any] = []

    for s in sorts:
        key = s.field_key
        desc_order = s.direction == SortDirection.DESC
        prop_id = _parse_property_key(key)
        if prop_id:
            ft = property_field_types.get(prop_id, "FIELD_TYPE_TEXT")
            query, _pa, col = join_property_value(
                query, models.Patient, prop_id, ft, "patient"
            )
            if desc_order:
                order_parts.append(col.desc().nulls_last())
            else:
                order_parts.append(col.asc().nulls_first())
            continue

        if key == "firstname":
            order_parts.append(
                models.Patient.firstname.desc()
                if desc_order
                else models.Patient.firstname.asc()
            )
        elif key == "lastname":
            order_parts.append(
                models.Patient.lastname.desc()
                if desc_order
                else models.Patient.lastname.asc()
            )
        elif key == "name":
            if desc_order:
                order_parts.append(models.Patient.lastname.desc().nulls_last())
                order_parts.append(models.Patient.firstname.desc().nulls_last())
            else:
                order_parts.append(models.Patient.lastname.asc().nulls_first())
                order_parts.append(models.Patient.firstname.asc().nulls_first())
        elif key == "state":
            order_parts.append(
                _state_order_case().desc()
                if desc_order
                else _state_order_case().asc()
            )
        elif key == "sex":
            order_parts.append(
                models.Patient.sex.desc() if desc_order else models.Patient.sex.asc()
            )
        elif key == "birthdate":
            order_parts.append(
                models.Patient.birthdate.desc().nulls_last()
                if desc_order
                else models.Patient.birthdate.asc().nulls_first()
            )
        elif key == "description":
            order_parts.append(
                models.Patient.description.desc().nulls_last()
                if desc_order
                else models.Patient.description.asc().nulls_first()
            )
        elif key == "position":
            query, ln = _ensure_position_join(query, ctx)
            t = location_title_expr(ln)
            order_parts.append(
                t.desc().nulls_last() if desc_order else t.asc().nulls_first()
            )
        elif key in LOCATION_SORT_KEY_KINDS:
            query, lineage_nodes = _ensure_position_lineage_joins(query, ctx)
            t = _location_title_for_kind(lineage_nodes, LOCATION_SORT_KEY_KINDS[key])
            order_parts.append(
                t.desc().nulls_last() if desc_order else t.asc().nulls_first()
            )

    if not order_parts:
        return query.order_by(models.Patient.id.asc())
    return query.order_by(*order_parts, models.Patient.id.asc())


def apply_patient_search(
    query: Select[Any],
    search: QuerySearchInput | None,
    ctx: dict[str, Any],
) -> Select[Any]:
    if not search or not search.search_text or not search.search_text.strip():
        return query
    pattern = f"%{search.search_text.strip()}%"
    expr = patient_display_name_expr(models.Patient)
    parts: list[Any] = [
        models.Patient.firstname.ilike(pattern),
        models.Patient.lastname.ilike(pattern),
        expr.ilike(pattern),
        models.Patient.description.ilike(pattern),
    ]
    if search.include_properties:
        pv = aliased(models.PropertyValue)
        query = query.outerjoin(
            pv,
            and_(
                pv.patient_id == models.Patient.id,
                pv.text_value.isnot(None),
            ),
        )
        parts.append(pv.text_value.ilike(pattern))
        ctx["needs_distinct"] = True
    query = query.where(or_(*parts))
    return query


def build_patient_queryable_fields_static() -> list[QueryableField]:
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
    date_ops = [
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
    choice_ops = [
        QueryOperator.EQ,
        QueryOperator.NEQ,
        QueryOperator.IN,
        QueryOperator.NOT_IN,
        QueryOperator.IS_NULL,
        QueryOperator.IS_NOT_NULL,
    ]
    states = [
        PatientState.WAIT,
        PatientState.ADMITTED,
        PatientState.DISCHARGED,
        PatientState.DEAD,
    ]
    state_keys = [s.value for s in states]
    state_labels = [s.value for s in states]

    sex_keys = [Sex.MALE.value, Sex.FEMALE.value, Sex.UNKNOWN.value]
    sex_labels = ["Male", "Female", "Unknown"]

    return [
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
        QueryableField(
            key="firstname",
            label="First name",
            kind=QueryableFieldKind.SCALAR,
            value_type=QueryableValueType.STRING,
            allowed_operators=str_ops,
            sortable=True,
            sort_directions=sort_directions_for(True),
            searchable=True,
        ),
        QueryableField(
            key="lastname",
            label="Last name",
            kind=QueryableFieldKind.SCALAR,
            value_type=QueryableValueType.STRING,
            allowed_operators=str_ops,
            sortable=True,
            sort_directions=sort_directions_for(True),
            searchable=True,
        ),
        QueryableField(
            key="state",
            label="State",
            kind=QueryableFieldKind.CHOICE,
            value_type=QueryableValueType.STRING,
            allowed_operators=choice_ops,
            sortable=True,
            sort_directions=sort_directions_for(True),
            searchable=False,
            choice=QueryableChoiceMeta(
                option_keys=state_keys,
                option_labels=state_labels,
            ),
        ),
        QueryableField(
            key="sex",
            label="Sex",
            kind=QueryableFieldKind.CHOICE,
            value_type=QueryableValueType.STRING,
            allowed_operators=choice_ops,
            sortable=True,
            sort_directions=sort_directions_for(True),
            searchable=False,
            choice=QueryableChoiceMeta(
                option_keys=sex_keys,
                option_labels=sex_labels,
            ),
        ),
        QueryableField(
            key="birthdate",
            label="Birthdate",
            kind=QueryableFieldKind.SCALAR,
            value_type=QueryableValueType.DATE,
            allowed_operators=date_ops,
            sortable=True,
            sort_directions=sort_directions_for(True),
            searchable=False,
        ),
        QueryableField(
            key="description",
            label="Description",
            kind=QueryableFieldKind.SCALAR,
            value_type=QueryableValueType.STRING,
            allowed_operators=str_ops,
            sortable=True,
            sort_directions=sort_directions_for(True),
            searchable=True,
        ),
        QueryableField(
            key="position",
            label="Location",
            kind=QueryableFieldKind.REFERENCE,
            value_type=QueryableValueType.UUID,
            allowed_operators=[
                QueryOperator.EQ,
                QueryOperator.IN,
                QueryOperator.CONTAINS,
                QueryOperator.STARTS_WITH,
                QueryOperator.ENDS_WITH,
                QueryOperator.IS_NULL,
                QueryOperator.IS_NOT_NULL,
            ],
            sortable=True,
            sort_directions=sort_directions_for(True),
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
        *[
            QueryableField(
                key=key,
                label=label,
                kind=QueryableFieldKind.SCALAR,
                value_type=QueryableValueType.STRING,
                allowed_operators=str_ops,
                sortable=True,
                sort_directions=sort_directions_for(True),
                searchable=False,
            )
            for key, label in LOCATION_SORT_KEY_LABELS.items()
        ],
    ]

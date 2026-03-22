from typing import Any

from sqlalchemy import select

from api.query.adapters import patient as patient_adapters
from api.query.adapters import task as task_adapters
from api.query.adapters import user as user_adapters
from api.query.enums import (
    QueryOperator,
    QueryableFieldKind,
    QueryableValueType,
    ReferenceFilterMode,
)
from api.query.graphql_types import (
    QueryableChoiceMeta,
    QueryableField,
    QueryableRelationMeta,
    sort_directions_for,
)
from api.query.registry import PATIENT, TASK, USER
from database import models


def _str_ops() -> list[QueryOperator]:
    return [
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


def _num_ops() -> list[QueryOperator]:
    return [
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


def _date_ops() -> list[QueryOperator]:
    return [
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


def _dt_ops() -> list[QueryOperator]:
    return _date_ops()


def _bool_ops() -> list[QueryOperator]:
    return [
        QueryOperator.EQ,
        QueryOperator.IS_NULL,
        QueryOperator.IS_NOT_NULL,
    ]


def _choice_ops() -> list[QueryOperator]:
    return [
        QueryOperator.EQ,
        QueryOperator.NEQ,
        QueryOperator.IN,
        QueryOperator.NOT_IN,
        QueryOperator.IS_NULL,
        QueryOperator.IS_NOT_NULL,
    ]


def _multi_choice_ops() -> list[QueryOperator]:
    return [
        QueryOperator.ANY_IN,
        QueryOperator.ALL_IN,
        QueryOperator.NONE_IN,
        QueryOperator.IS_EMPTY,
        QueryOperator.IS_NOT_EMPTY,
        QueryOperator.IS_NULL,
        QueryOperator.IS_NOT_NULL,
    ]


def _user_ref_ops() -> list[QueryOperator]:
    return [
        QueryOperator.EQ,
        QueryOperator.IN,
        QueryOperator.IS_NULL,
        QueryOperator.IS_NOT_NULL,
    ]


def _property_definition_to_field(p: models.PropertyDefinition) -> QueryableField:
    ft = p.field_type
    key = f"property_{p.id}"
    name = p.name
    raw_opts = (p.options or "").strip()
    option_labels = [x.strip() for x in raw_opts.split(",") if x.strip()] if raw_opts else []
    option_keys = list(option_labels)

    if ft == "FIELD_TYPE_TEXT":
        return QueryableField(
            key=key,
            label=name,
            kind=QueryableFieldKind.PROPERTY,
            value_type=QueryableValueType.STRING,
            allowed_operators=_str_ops(),
            sortable=True,
            sort_directions=sort_directions_for(True),
            searchable=True,
            property_definition_id=str(p.id),
        )
    if ft == "FIELD_TYPE_NUMBER":
        return QueryableField(
            key=key,
            label=name,
            kind=QueryableFieldKind.PROPERTY,
            value_type=QueryableValueType.NUMBER,
            allowed_operators=_num_ops(),
            sortable=True,
            sort_directions=sort_directions_for(True),
            searchable=False,
            property_definition_id=str(p.id),
        )
    if ft == "FIELD_TYPE_CHECKBOX":
        return QueryableField(
            key=key,
            label=name,
            kind=QueryableFieldKind.PROPERTY,
            value_type=QueryableValueType.BOOLEAN,
            allowed_operators=_bool_ops(),
            sortable=True,
            sort_directions=sort_directions_for(True),
            searchable=False,
            property_definition_id=str(p.id),
        )
    if ft == "FIELD_TYPE_DATE":
        return QueryableField(
            key=key,
            label=name,
            kind=QueryableFieldKind.PROPERTY,
            value_type=QueryableValueType.DATE,
            allowed_operators=_date_ops(),
            sortable=True,
            sort_directions=sort_directions_for(True),
            searchable=False,
            property_definition_id=str(p.id),
        )
    if ft == "FIELD_TYPE_DATE_TIME":
        return QueryableField(
            key=key,
            label=name,
            kind=QueryableFieldKind.PROPERTY,
            value_type=QueryableValueType.DATETIME,
            allowed_operators=_dt_ops(),
            sortable=True,
            sort_directions=sort_directions_for(True),
            searchable=False,
            property_definition_id=str(p.id),
        )
    if ft == "FIELD_TYPE_SELECT":
        return QueryableField(
            key=key,
            label=name,
            kind=QueryableFieldKind.CHOICE,
            value_type=QueryableValueType.STRING,
            allowed_operators=_choice_ops(),
            sortable=True,
            sort_directions=sort_directions_for(True),
            searchable=False,
            property_definition_id=str(p.id),
            choice=QueryableChoiceMeta(
                option_keys=option_keys,
                option_labels=option_labels,
            ),
        )
    if ft == "FIELD_TYPE_MULTI_SELECT":
        return QueryableField(
            key=key,
            label=name,
            kind=QueryableFieldKind.CHOICE_LIST,
            value_type=QueryableValueType.STRING_LIST,
            allowed_operators=_multi_choice_ops(),
            sortable=False,
            sort_directions=sort_directions_for(False),
            searchable=False,
            property_definition_id=str(p.id),
            choice=QueryableChoiceMeta(
                option_keys=option_keys,
                option_labels=option_labels,
            ),
        )
    if ft == "FIELD_TYPE_USER":
        return QueryableField(
            key=key,
            label=name,
            kind=QueryableFieldKind.REFERENCE,
            value_type=QueryableValueType.UUID,
            allowed_operators=_user_ref_ops(),
            sortable=True,
            sort_directions=sort_directions_for(True),
            searchable=False,
            property_definition_id=str(p.id),
            relation=QueryableRelationMeta(
                target_entity="User",
                id_field_key="id",
                label_field_key="name",
                allowed_filter_modes=[ReferenceFilterMode.ID],
            ),
        )
    return QueryableField(
        key=key,
        label=name,
        kind=QueryableFieldKind.PROPERTY,
        value_type=QueryableValueType.STRING,
        allowed_operators=_str_ops(),
        sortable=True,
        sort_directions=sort_directions_for(True),
        searchable=True,
        property_definition_id=str(p.id),
    )


async def load_queryable_fields(
    db: Any, entity: str
) -> list[QueryableField]:
    e = entity.strip()
    if e == TASK:
        base = task_adapters.build_task_queryable_fields_static()
        prop_rows = (
            await db.execute(
                select(models.PropertyDefinition).where(
                    models.PropertyDefinition.is_active.is_(True),
                )
            )
        ).scalars().all()
        extra = []
        for p in prop_rows:
            ents = (p.allowed_entities or "").split(",")
            if "TASK" not in [x.strip() for x in ents if x.strip()]:
                continue
            extra.append(_property_definition_to_field(p))
        return base + extra
    if e == PATIENT:
        base = patient_adapters.build_patient_queryable_fields_static()
        prop_rows = (
            await db.execute(
                select(models.PropertyDefinition).where(
                    models.PropertyDefinition.is_active.is_(True),
                )
            )
        ).scalars().all()
        extra = []
        for p in prop_rows:
            ents = (p.allowed_entities or "").split(",")
            if "PATIENT" not in [x.strip() for x in ents if x.strip()]:
                continue
            extra.append(_property_definition_to_field(p))
        return base + extra
    if e == USER:
        return user_adapters.build_user_queryable_fields_static()
    return []

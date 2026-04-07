from typing import Any

from sqlalchemy import Select, and_, select
from sqlalchemy.orm import aliased

from database import models


def property_value_column_for_field_type(field_type: str) -> str:
    mapping = {
        "FIELD_TYPE_TEXT": "text_value",
        "FIELD_TYPE_NUMBER": "number_value",
        "FIELD_TYPE_CHECKBOX": "boolean_value",
        "FIELD_TYPE_DATE": "date_value",
        "FIELD_TYPE_DATE_TIME": "date_time_value",
        "FIELD_TYPE_SELECT": "select_value",
        "FIELD_TYPE_MULTI_SELECT": "multi_select_values",
        "FIELD_TYPE_USER": "user_value",
    }
    return mapping.get(field_type, "text_value")


def join_property_value(
    query: Select[Any],
    root_model: type,
    property_definition_id: str,
    field_type: str,
    entity: str,
) -> tuple[Select[Any], Any, Any]:
    property_alias = aliased(models.PropertyValue)
    value_column = getattr(
        property_alias, property_value_column_for_field_type(field_type)
    )

    if entity == "patient":
        join_condition = and_(
            property_alias.patient_id == root_model.id,
            property_alias.definition_id == property_definition_id,
        )
    else:
        join_condition = and_(
            property_alias.task_id == root_model.id,
            property_alias.definition_id == property_definition_id,
        )

    query = query.outerjoin(property_alias, join_condition)
    return query, property_alias, value_column


async def load_property_field_types(
    db: Any, definition_ids: set[str]
) -> dict[str, str]:
    if not definition_ids:
        return {}
    result = await db.execute(
        select(models.PropertyDefinition).where(
            models.PropertyDefinition.id.in_(definition_ids)
        )
    )
    rows = result.scalars().all()
    return {str(p.id): p.field_type for p in rows}

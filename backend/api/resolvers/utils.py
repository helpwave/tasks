from api.inputs import PropertyValueInput
from database import models
from sqlalchemy.ext.asyncio import AsyncSession


async def process_properties(
    db: AsyncSession,
    entity,
    props_data: list[PropertyValueInput],
    entity_kind: str,
):
    if not props_data:
        return
    for p_in in props_data:
        ms_val = (
            ",".join(p_in.multi_select_values)
            if p_in.multi_select_values
            else None
        )
        prop_val = models.PropertyValue(
            definition_id=p_in.definition_id,
            text_value=p_in.text_value,
            number_value=p_in.number_value,
            boolean_value=p_in.boolean_value,
            date_value=p_in.date_value,
            date_time_value=p_in.date_time_value,
            select_value=p_in.select_value,
            multi_select_values=ms_val,
        )

        if entity_kind == "patient":
            prop_val.patient_id = entity.id
        elif entity_kind == "task":
            prop_val.task_id = entity.id

        db.add(prop_val)

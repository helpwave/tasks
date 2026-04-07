from api.inputs import PropertyValueInput
from database import models
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class PropertyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def process_properties(
        self,
        entity: models.Patient | models.Task,
        props_data: list[PropertyValueInput],
        entity_kind: str,
    ) -> None:
        if entity_kind == "patient":
            existing_query = select(models.PropertyValue).where(
                models.PropertyValue.patient_id == entity.id
            )
        elif entity_kind == "task":
            existing_query = select(models.PropertyValue).where(
                models.PropertyValue.task_id == entity.id
            )
        else:
            return

        result = await self.db.execute(existing_query)
        existing_props = list(result.scalars().all())

        definition_ids_in_input = {prop.definition_id for prop in props_data}

        for existing_prop in existing_props:
            if existing_prop.definition_id not in definition_ids_in_input:
                await self.db.delete(existing_prop)

        for prop_input in props_data:
            multi_select_value = (
                ",".join(prop_input.multi_select_values)
                if prop_input.multi_select_values
                else None
            )

            existing_prop = next(
                (
                    p
                    for p in existing_props
                    if p.definition_id == prop_input.definition_id
                ),
                None,
            )

            if existing_prop:
                existing_prop.text_value = prop_input.text_value
                existing_prop.number_value = prop_input.number_value
                existing_prop.boolean_value = prop_input.boolean_value
                existing_prop.date_value = prop_input.date_value
                existing_prop.date_time_value = prop_input.date_time_value
                existing_prop.select_value = prop_input.select_value
                existing_prop.multi_select_values = multi_select_value
                existing_prop.user_value = prop_input.user_value
            else:
                prop_value = models.PropertyValue(
                    definition_id=prop_input.definition_id,
                    text_value=prop_input.text_value,
                    number_value=prop_input.number_value,
                    boolean_value=prop_input.boolean_value,
                    date_value=prop_input.date_value,
                    date_time_value=prop_input.date_time_value,
                    select_value=prop_input.select_value,
                    multi_select_values=multi_select_value,
                    user_value=prop_input.user_value,
                )

                if entity_kind == "patient":
                    prop_value.patient_id = entity.id
                elif entity_kind == "task":
                    prop_value.task_id = entity.id

                self.db.add(prop_value)

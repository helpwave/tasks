from api.inputs import PropertyValueInput
from database import models
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
        if not props_data:
            return

        for prop_input in props_data:
            multi_select_value = (
                ",".join(prop_input.multi_select_values)
                if prop_input.multi_select_values
                else None
            )

            prop_value = models.PropertyValue(
                definition_id=prop_input.definition_id,
                text_value=prop_input.text_value,
                number_value=prop_input.number_value,
                boolean_value=prop_input.boolean_value,
                date_value=prop_input.date_value,
                date_time_value=prop_input.date_time_value,
                select_value=prop_input.select_value,
                multi_select_values=multi_select_value,
            )

            if entity_kind == "patient":
                prop_value.patient_id = entity.id
            elif entity_kind == "task":
                prop_value.task_id = entity.id

            self.db.add(prop_value)

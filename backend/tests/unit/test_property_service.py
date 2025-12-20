import pytest
from api.inputs import PropertyValueInput
from api.services.property import PropertyService
from database.models.patient import Patient
from database.models.task import Task
from api.inputs import Sex, PatientState


@pytest.mark.asyncio
async def test_process_properties_for_patient(db_session, sample_patient):
    service = PropertyService(db_session)
    props = [
        PropertyValueInput(
            definition_id="def-1",
            text_value="Test Value",
        ),
    ]
    await service.process_properties(sample_patient, props, "patient")
    await db_session.commit()

    from database.models.property import PropertyValue
    from sqlalchemy import select
    result = await db_session.execute(
        select(PropertyValue).where(PropertyValue.patient_id == sample_patient.id)
    )
    prop_values = result.scalars().all()
    assert len(prop_values) == 1
    assert prop_values[0].text_value == "Test Value"


@pytest.mark.asyncio
async def test_process_properties_for_task(db_session, sample_task):
    service = PropertyService(db_session)
    props = [
        PropertyValueInput(
            definition_id="def-1",
            number_value=42,
        ),
    ]
    await service.process_properties(sample_task, props, "task")
    await db_session.commit()

    from database.models.property import PropertyValue
    from sqlalchemy import select
    result = await db_session.execute(
        select(PropertyValue).where(PropertyValue.task_id == sample_task.id)
    )
    prop_values = result.scalars().all()
    assert len(prop_values) == 1
    assert prop_values[0].number_value == 42


@pytest.mark.asyncio
async def test_process_properties_empty_list(db_session, sample_patient):
    service = PropertyService(db_session)
    await service.process_properties(sample_patient, [], "patient")
    await db_session.commit()

    from database.models.property import PropertyValue
    from sqlalchemy import select
    result = await db_session.execute(
        select(PropertyValue).where(PropertyValue.patient_id == sample_patient.id)
    )
    prop_values = result.scalars().all()
    assert len(prop_values) == 0


@pytest.mark.asyncio
async def test_process_properties_multi_select(db_session, sample_patient):
    service = PropertyService(db_session)
    props = [
        PropertyValueInput(
            definition_id="def-1",
            multi_select_values=["option1", "option2", "option3"],
        ),
    ]
    await service.process_properties(sample_patient, props, "patient")
    await db_session.commit()

    from database.models.property import PropertyValue
    from sqlalchemy import select
    result = await db_session.execute(
        select(PropertyValue).where(PropertyValue.patient_id == sample_patient.id)
    )
    prop_values = result.scalars().all()
    assert len(prop_values) == 1
    assert prop_values[0].multi_select_values == "option1,option2,option3"


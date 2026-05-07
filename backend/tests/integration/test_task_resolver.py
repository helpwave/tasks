import pytest
from api.context import Context
from api.resolvers.task import TaskQuery, TaskMutation
from database.models.property import PropertyDefinition, PropertyValue
from database.models.task import Task


class MockInfo:
    def __init__(self, db, user=None):
        self.context = Context(db=db, user=user)


@pytest.mark.asyncio
async def test_task_query_get_task(db_session, sample_task, sample_user_with_location_access):
    info = MockInfo(db_session, sample_user_with_location_access)
    query = TaskQuery()
    result = await query.task(info, sample_task.id)
    assert result is not None
    assert result.id == sample_task.id
    assert result.title == sample_task.title


@pytest.mark.asyncio
async def test_task_query_tasks_by_patient(db_session, sample_patient, sample_user_with_location_access):
    info = MockInfo(db_session, sample_user_with_location_access)
    task1 = Task(title="Task 1", patient_id=sample_patient.id)
    task2 = Task(title="Task 2", patient_id=sample_patient.id)
    db_session.add(task1)
    db_session.add(task2)
    await db_session.commit()

    query = TaskQuery()
    results = await query.tasks(info, patient_id=sample_patient.id)
    assert len(results) >= 2
    task_titles = {t.title for t in results}
    assert "Task 1" in task_titles
    assert "Task 2" in task_titles


@pytest.mark.asyncio
async def test_task_mutation_create_task(db_session, sample_patient, sample_user_with_location_access):
    from api.inputs import CreateTaskInput

    info = MockInfo(db_session, sample_user_with_location_access)
    mutation = TaskMutation()
    input_data = CreateTaskInput(
        title="New Task",
        description="Description",
        patient_id=sample_patient.id,
    )
    result = await mutation.create_task(info, input_data)
    assert result.id is not None
    assert result.title == "New Task"
    assert result.patient_id == sample_patient.id


@pytest.mark.asyncio
async def test_task_mutation_update_task(db_session, sample_task, sample_user_with_location_access):
    from api.inputs import UpdateTaskInput

    info = MockInfo(db_session, sample_user_with_location_access)
    mutation = TaskMutation()
    input_data = UpdateTaskInput(title="Updated Title")
    result = await mutation.update_task(info, sample_task.id, input_data)
    assert result.title == "Updated Title"
    assert result.id == sample_task.id


@pytest.mark.asyncio
async def test_task_mutation_complete_task(db_session, sample_task, sample_user_with_location_access):
    info = MockInfo(db_session, sample_user_with_location_access)
    mutation = TaskMutation()
    result = await mutation.complete_task(info, sample_task.id)
    assert result.done is True
    assert result.id == sample_task.id


@pytest.mark.asyncio
async def test_task_mutation_delete_task(db_session, sample_task, sample_user_with_location_access):
    info = MockInfo(db_session, sample_user_with_location_access)
    mutation = TaskMutation()
    task_id = sample_task.id
    result = await mutation.delete_task(info, task_id)
    assert result is True

    query = TaskQuery()
    task = await query.task(info, task_id)
    assert task is None


@pytest.mark.asyncio
async def test_task_mutation_clear_task_property(
    db_session,
    sample_task,
    sample_user_with_location_access,
):
    info = MockInfo(db_session, sample_user_with_location_access)
    mutation = TaskMutation()
    property_definition = PropertyDefinition(
        id="property-definition-1",
        name="Test Property",
        field_type="FIELD_TYPE_TEXT",
        allowed_entities="TASK",
        is_active=True,
    )
    other_property_definition = PropertyDefinition(
        id="other-definition",
        name="Other Property",
        field_type="FIELD_TYPE_TEXT",
        allowed_entities="TASK",
        is_active=True,
    )
    task_without_target = Task(
        id="task-2",
        title="Task 2",
        patient_id=sample_task.patient_id,
    )
    value_on_target = PropertyValue(
        id="property-value-1",
        definition_id=property_definition.id,
        task_id=sample_task.id,
        text_value="A",
    )
    value_on_other_definition = PropertyValue(
        id="property-value-2",
        definition_id="other-definition",
        task_id=sample_task.id,
        text_value="B",
    )
    value_on_other_task = PropertyValue(
        id="property-value-3",
        definition_id=property_definition.id,
        task_id=task_without_target.id,
        text_value="C",
    )
    db_session.add(property_definition)
    db_session.add(other_property_definition)
    db_session.add(task_without_target)
    db_session.add(value_on_target)
    db_session.add(value_on_other_definition)
    db_session.add(value_on_other_task)
    await db_session.commit()

    cleared_count = await mutation.clear_task_property(
        info,
        property_definition_id=property_definition.id,
        task_ids=[sample_task.id],
    )

    assert cleared_count == 1
    remaining = await db_session.execute(
        PropertyValue.__table__.select().where(
            PropertyValue.id.in_(
                [
                    value_on_target.id,
                    value_on_other_definition.id,
                    value_on_other_task.id,
                ]
            )
        )
    )
    remaining_ids = {row.id for row in remaining}
    assert value_on_target.id not in remaining_ids
    assert value_on_other_definition.id in remaining_ids
    assert value_on_other_task.id in remaining_ids

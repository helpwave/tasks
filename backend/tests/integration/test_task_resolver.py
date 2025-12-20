import pytest
from api.context import Context
from api.resolvers.task import TaskQuery, TaskMutation
from database.models.task import Task


class MockInfo:
    def __init__(self, db):
        self.context = Context(db=db)


@pytest.mark.asyncio
async def test_task_query_get_task(db_session, sample_task):
    info = MockInfo(db_session)
    query = TaskQuery()
    result = await query.task(info, sample_task.id)
    assert result is not None
    assert result.id == sample_task.id
    assert result.title == sample_task.title


@pytest.mark.asyncio
async def test_task_query_tasks_by_patient(db_session, sample_patient):
    info = MockInfo(db_session)
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
async def test_task_mutation_create_task(db_session, sample_patient):
    from api.inputs import CreateTaskInput

    info = MockInfo(db_session)
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
async def test_task_mutation_update_task(db_session, sample_task):
    from api.inputs import UpdateTaskInput

    info = MockInfo(db_session)
    mutation = TaskMutation()
    input_data = UpdateTaskInput(title="Updated Title")
    result = await mutation.update_task(info, sample_task.id, input_data)
    assert result.title == "Updated Title"
    assert result.id == sample_task.id


@pytest.mark.asyncio
async def test_task_mutation_complete_task(db_session, sample_task):
    info = MockInfo(db_session)
    mutation = TaskMutation()
    result = await mutation.complete_task(info, sample_task.id)
    assert result.done is True
    assert result.id == sample_task.id


@pytest.mark.asyncio
async def test_task_mutation_delete_task(db_session, sample_task):
    info = MockInfo(db_session)
    mutation = TaskMutation()
    task_id = sample_task.id
    result = await mutation.delete_task(info, task_id)
    assert result is True

    query = TaskQuery()
    task = await query.task(info, task_id)
    assert task is None



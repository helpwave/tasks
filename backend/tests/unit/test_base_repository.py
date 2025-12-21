import pytest
from api.services.base import BaseRepository
from database.models.task import Task


@pytest.mark.asyncio
async def test_get_by_id(db_session, sample_task):
    repo = BaseRepository(db_session, Task)
    result = await repo.get_by_id(sample_task.id)
    assert result is not None
    assert result.id == sample_task.id
    assert result.title == "Test Task"


@pytest.mark.asyncio
async def test_get_by_id_not_found(db_session):
    repo = BaseRepository(db_session, Task)
    result = await repo.get_by_id("non-existent")
    assert result is None


@pytest.mark.asyncio
async def test_get_by_id_or_raise(db_session, sample_task):
    repo = BaseRepository(db_session, Task)
    result = await repo.get_by_id_or_raise(sample_task.id)
    assert result.id == sample_task.id


@pytest.mark.asyncio
async def test_get_by_id_or_raise_not_found(db_session):
    repo = BaseRepository(db_session, Task)
    with pytest.raises(Exception, match="Entity not found"):
        await repo.get_by_id_or_raise("non-existent")


@pytest.mark.asyncio
async def test_get_all(db_session, sample_task):
    repo = BaseRepository(db_session, Task)
    results = await repo.get_all()
    assert len(results) >= 1
    assert any(t.id == sample_task.id for t in results)


@pytest.mark.asyncio
async def test_create(db_session):
    repo = BaseRepository(db_session, Task)
    new_task = Task(
        title="New Task",
        description="New Description",
        patient_id="patient-1",
    )
    result = await repo.create(new_task)
    assert result.id is not None
    assert result.title == "New Task"


@pytest.mark.asyncio
async def test_update(db_session, sample_task):
    repo = BaseRepository(db_session, Task)
    sample_task.title = "Updated Title"
    result = await repo.update(sample_task)
    assert result.title == "Updated Title"


@pytest.mark.asyncio
async def test_delete(db_session, sample_task):
    repo = BaseRepository(db_session, Task)
    task_id = sample_task.id
    await repo.delete(sample_task)
    result = await repo.get_by_id(task_id)
    assert result is None

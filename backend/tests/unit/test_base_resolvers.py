import pytest
from api.context import Context
from api.resolvers.base import BaseMutationResolver, BaseQueryResolver
from database.models.task import Task


class MockInfo:
    def __init__(self, db):
        self.context = Context(db=db)


@pytest.mark.asyncio
async def test_base_query_resolver_get_by_id(db_session, sample_task):
    resolver = BaseQueryResolver(Task)
    info = MockInfo(db_session)
    result = await resolver.get_by_id(info, sample_task.id)
    assert result is not None
    assert result.id == sample_task.id


@pytest.mark.asyncio
async def test_base_query_resolver_get_all(db_session, sample_task):
    resolver = BaseQueryResolver(Task)
    info = MockInfo(db_session)
    results = await resolver.get_all(info)
    assert len(results) >= 1
    assert any(t.id == sample_task.id for t in results)


@pytest.mark.asyncio
async def test_base_mutation_resolver_create_and_notify(db_session):
    resolver = BaseMutationResolver(Task, "task")
    info = MockInfo(db_session)
    new_task = Task(title="New Task", description="Description")
    result = await resolver.create_and_notify(info, new_task)
    assert result.id is not None
    assert result.title == "New Task"


@pytest.mark.asyncio
async def test_base_mutation_resolver_update_and_notify(db_session, sample_task):
    resolver = BaseMutationResolver(Task, "task")
    info = MockInfo(db_session)
    sample_task.title = "Updated Title"
    result = await resolver.update_and_notify(info, sample_task)
    assert result.title == "Updated Title"


@pytest.mark.asyncio
async def test_base_mutation_resolver_delete_entity(db_session, sample_task):
    resolver = BaseMutationResolver(Task, "task")
    info = MockInfo(db_session)
    await resolver.delete_entity(info, sample_task)

    repo = resolver.get_repository(db_session)
    result = await repo.get_by_id(sample_task.id)
    assert result is None

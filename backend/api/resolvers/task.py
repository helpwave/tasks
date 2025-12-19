from collections.abc import AsyncGenerator

from datetime import timezone

import strawberry
from api.context import Info
from api.inputs import CreateTaskInput, UpdateTaskInput
from api.types.task import TaskType
from database import models
from database.session import redis_client
from sqlalchemy import desc, select

from .utils import process_properties


@strawberry.type
class TaskQuery:
    @strawberry.field
    async def task(self, info: Info, id: strawberry.ID) -> TaskType | None:
        result = await info.context.db.execute(
            select(models.Task).where(models.Task.id == id),
        )
        return result.scalars().first()

    @strawberry.field
    async def tasks(
        self,
        info: Info,
        patient_id: strawberry.ID | None = None,
        assignee_id: strawberry.ID | None = None,
    ) -> list[TaskType]:
        query = select(models.Task)
        if patient_id:
            query = query.where(models.Task.patient_id == patient_id)
        if assignee_id:
            query = query.where(models.Task.assignee_id == assignee_id)

        result = await info.context.db.execute(query)
        return result.scalars().all()

    @strawberry.field
    async def recent_tasks(
        self,
        info: Info,
        limit: int = 10,
    ) -> list[TaskType]:
        result = await info.context.db.execute(
            select(models.Task)
            .order_by(desc(models.Task.update_date))
            .limit(limit),
        )
        return result.scalars().all()


@strawberry.type
class TaskMutation:
    @strawberry.mutation
    async def create_task(self, info: Info, data: CreateTaskInput) -> TaskType:
        due_date = data.due_date
        if due_date and due_date.tzinfo is not None:
            due_date = due_date.astimezone(timezone.utc).replace(tzinfo=None)

        new_task = models.Task(
            title=data.title,
            description=data.description,
            patient_id=data.patient_id,
            assignee_id=data.assignee_id,
            due_date=due_date,
        )
        info.context.db.add(new_task)
        if data.properties:
            await process_properties(
                info.context.db,
                new_task,
                data.properties,
                "task",
            )

        await info.context.db.commit()
        await info.context.db.refresh(new_task)
        await redis_client.publish("task_created", new_task.id)
        if new_task.patient_id:
            await redis_client.publish("patient_updated", new_task.patient_id)
        return new_task

    @strawberry.mutation
    async def update_task(
        self,
        info: Info,
        id: strawberry.ID,
        data: UpdateTaskInput,
    ) -> TaskType:
        db = info.context.db
        result = await db.execute(
            select(models.Task).where(models.Task.id == id),
        )
        task = result.scalars().first()
        if not task:
            raise Exception("Task not found")

        if data.title is not None:
            task.title = data.title
        if data.description is not None:
            task.description = data.description
        if data.done is not None:
            task.done = data.done

        if data.due_date is not None:
            if data.due_date.tzinfo is not None:
                task.due_date = data.due_date.astimezone(timezone.utc).replace(
                    tzinfo=None,
                )
            else:
                task.due_date = data.due_date

        if data.properties:
            await process_properties(db, task, data.properties, "task")

        await db.commit()
        await db.refresh(task)
        await redis_client.publish("task_updated", task.id)
        if task.patient_id:
            await redis_client.publish("patient_updated", task.patient_id)
        return task

    @strawberry.mutation
    async def assign_task(
        self,
        info: Info,
        id: strawberry.ID,
        user_id: strawberry.ID,
    ) -> TaskType:
        db = info.context.db
        result = await db.execute(
            select(models.Task).where(models.Task.id == id),
        )
        task = result.scalars().first()
        if not task:
            raise Exception("Task not found")

        task.assignee_id = user_id
        await db.commit()
        await db.refresh(task)
        await redis_client.publish("task_updated", task.id)
        if task.patient_id:
            await redis_client.publish("patient_updated", task.patient_id)
        return task

    @strawberry.mutation
    async def unassign_task(self, info: Info, id: strawberry.ID) -> TaskType:
        db = info.context.db
        result = await db.execute(
            select(models.Task).where(models.Task.id == id),
        )
        task = result.scalars().first()
        if not task:
            raise Exception("Task not found")

        task.assignee_id = None
        await db.commit()
        await db.refresh(task)
        await redis_client.publish("task_updated", task.id)
        if task.patient_id:
            await redis_client.publish("patient_updated", task.patient_id)
        return task

    @strawberry.mutation
    async def complete_task(self, info: Info, id: strawberry.ID) -> TaskType:
        db = info.context.db
        result = await db.execute(
            select(models.Task).where(models.Task.id == id),
        )
        task = result.scalars().first()
        if not task:
            raise Exception("Task not found")

        task.done = True
        await db.commit()
        await db.refresh(task)
        await redis_client.publish("task_updated", task.id)
        if task.patient_id:
            await redis_client.publish("patient_updated", task.patient_id)
        return task

    @strawberry.mutation
    async def reopen_task(self, info: Info, id: strawberry.ID) -> TaskType:
        db = info.context.db
        result = await db.execute(
            select(models.Task).where(models.Task.id == id),
        )
        task = result.scalars().first()
        if not task:
            raise Exception("Task not found")

        task.done = False
        await db.commit()
        await db.refresh(task)
        await redis_client.publish("task_updated", task.id)
        if task.patient_id:
            await redis_client.publish("patient_updated", task.patient_id)
        return task

    @strawberry.mutation
    async def delete_task(self, info: Info, id: strawberry.ID) -> bool:
        db = info.context.db
        result = await db.execute(
            select(models.Task).where(models.Task.id == id),
        )
        task = result.scalars().first()
        if not task:
            return False

        task_id = task.id
        patient_id = task.patient_id
        await db.delete(task)
        await db.commit()
        await redis_client.publish("task_deleted", task_id)
        if patient_id:
            await redis_client.publish("patient_updated", patient_id)
        return True


@strawberry.type
class TaskSubscription:
    @strawberry.subscription
    async def task_created(
        self,
        info: Info,
    ) -> AsyncGenerator[strawberry.ID, None]:
        pubsub = redis_client.pubsub()
        await pubsub.subscribe("task_created")
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    yield message["data"]
        finally:
            await pubsub.close()

    @strawberry.subscription
    async def task_updated(
        self,
        info: Info,
        task_id: strawberry.ID | None = None,
    ) -> AsyncGenerator[strawberry.ID, None]:
        pubsub = redis_client.pubsub()
        await pubsub.subscribe("task_updated")
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    task_id_str = message["data"]
                    if task_id is None or task_id_str == task_id:
                        yield task_id_str
        finally:
            await pubsub.close()

    @strawberry.subscription
    async def task_deleted(
        self,
        info: Info,
    ) -> AsyncGenerator[strawberry.ID, None]:
        pubsub = redis_client.pubsub()
        await pubsub.subscribe("task_deleted")
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    yield message["data"]
        finally:
            await pubsub.close()

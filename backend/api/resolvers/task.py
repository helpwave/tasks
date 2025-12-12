import strawberry
from api.context import Info
from api.inputs import CreateTaskInput, UpdateTaskInput
from api.types.task import TaskType
from database import models
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
    async def recent_tasks(self, info: Info, limit: int = 10) -> list[TaskType]:
        result = await info.context.db.execute(
            select(models.Task)
            .order_by(desc(models.Task.update_date))
            .limit(limit)
        )
        return result.scalars().all()


@strawberry.type
class TaskMutation:
    @strawberry.mutation
    async def create_task(self, info: Info, data: CreateTaskInput) -> TaskType:
        new_task = models.Task(
            title=data.title,
            description=data.description,
            patient_id=data.patient_id,
            assignee_id=data.assignee_id,
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
        if data.assignee_id is not None:
            task.assignee_id = data.assignee_id

        if data.properties:
            await process_properties(db, task, data.properties, "task")

        await db.commit()
        await db.refresh(task)
        return task

    @strawberry.mutation
    async def complete_task(self, info: Info, id: strawberry.ID) -> TaskType:
        db = info.context.db
        result = await db.execute(
            select(models.Task).where(models.Task.id == id)
        )
        task = result.scalars().first()
        if not task:
            raise Exception("Task not found")

        task.done = True
        await db.commit()
        await db.refresh(task)
        return task

    @strawberry.mutation
    async def reopen_task(self, info: Info, id: strawberry.ID) -> TaskType:
        db = info.context.db
        result = await db.execute(
            select(models.Task).where(models.Task.id == id)
        )
        task = result.scalars().first()
        if not task:
            raise Exception("Task not found")

        task.done = False
        await db.commit()
        await db.refresh(task)
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

        await db.delete(task)
        await db.commit()
        return True

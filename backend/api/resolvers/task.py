from collections.abc import AsyncGenerator

import strawberry
from api.audit import audit_log
from api.context import Info
from api.inputs import CreateTaskInput, UpdateTaskInput
from api.resolvers.base import BaseMutationResolver, BaseSubscriptionResolver
from api.services.base import BaseRepository
from api.services.checksum import validate_checksum
from api.services.datetime import normalize_datetime_to_utc
from api.services.property import PropertyService
from api.types.task import TaskType
from database import models
from sqlalchemy import desc, select


@strawberry.type
class TaskQuery:
    @strawberry.field
    async def task(self, info: Info, id: strawberry.ID) -> TaskType | None:
        repo = BaseRepository(info.context.db, models.Task)
        return await repo.get_by_id(id)

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
class TaskMutation(BaseMutationResolver[models.Task]):
    @staticmethod
    def _get_property_service(db) -> PropertyService:
        return PropertyService(db)

    @strawberry.mutation
    @audit_log("create_task")
    async def create_task(self, info: Info, data: CreateTaskInput) -> TaskType:
        new_task = models.Task(
            title=data.title,
            description=data.description,
            patient_id=data.patient_id,
            assignee_id=data.assignee_id,
            due_date=normalize_datetime_to_utc(data.due_date),
        )

        if data.properties:
            property_service = TaskMutation._get_property_service(info.context.db)
            await property_service.process_properties(
                new_task, data.properties, "task"
            )

        return await BaseMutationResolver.create_and_notify(
            info,
            new_task,
            models.Task,
            "task",
            "patient" if new_task.patient_id else None,
            new_task.patient_id if new_task.patient_id else None,
        )

    @strawberry.mutation
    @audit_log("update_task")
    async def update_task(
        self,
        info: Info,
        id: strawberry.ID,
        data: UpdateTaskInput,
    ) -> TaskType:
        db = info.context.db
        repo = BaseMutationResolver.get_repository(db, models.Task)
        task = await repo.get_by_id_or_raise(id, "Task not found")

        if data.checksum:
            validate_checksum(task, data.checksum, "Task")

        if data.title is not None:
            task.title = data.title
        if data.description is not None:
            task.description = data.description
        if data.done is not None:
            task.done = data.done

        if data.due_date is not strawberry.UNSET:
            task.due_date = (
                normalize_datetime_to_utc(data.due_date)
                if data.due_date
                else None
            )

        if data.properties:
            property_service = TaskMutation._get_property_service(db)
            await property_service.process_properties(
                task, data.properties, "task"
            )

        return await BaseMutationResolver.update_and_notify(
            info,
            task,
            models.Task,
            "task",
            "patient",
            task.patient_id,
        )

    @staticmethod
    async def _update_task_field(
        info: Info,
        id: strawberry.ID,
        field_updater,
    ) -> TaskType:
        from api.services.notifications import notify_entity_update
        db = info.context.db
        repo = BaseMutationResolver.get_repository(db, models.Task)
        task = await repo.get_by_id_or_raise(id, "Task not found")
        field_updater(task)
        await BaseMutationResolver.update_and_notify(
            info, task, models.Task, "task", "patient", task.patient_id
        )
        return task

    @strawberry.mutation
    @audit_log("assign_task")
    async def assign_task(
        self,
        info: Info,
        id: strawberry.ID,
        user_id: strawberry.ID,
    ) -> TaskType:
        return await TaskMutation._update_task_field(
            info,
            id,
            lambda task: setattr(task, "assignee_id", user_id),
        )

    @strawberry.mutation
    @audit_log("unassign_task")
    async def unassign_task(self, info: Info, id: strawberry.ID) -> TaskType:
        return await TaskMutation._update_task_field(
            info,
            id,
            lambda task: setattr(task, "assignee_id", None),
        )

    @strawberry.mutation
    @audit_log("complete_task")
    async def complete_task(self, info: Info, id: strawberry.ID) -> TaskType:
        return await TaskMutation._update_task_field(
            info,
            id,
            lambda task: setattr(task, "done", True),
        )

    @strawberry.mutation
    @audit_log("reopen_task")
    async def reopen_task(self, info: Info, id: strawberry.ID) -> TaskType:
        return await TaskMutation._update_task_field(
            info,
            id,
            lambda task: setattr(task, "done", False),
        )

    @strawberry.mutation
    @audit_log("delete_task")
    async def delete_task(self, info: Info, id: strawberry.ID) -> bool:
        db = info.context.db
        repo = BaseMutationResolver.get_repository(db, models.Task)
        task = await repo.get_by_id(id)
        if not task:
            return False

        patient_id = task.patient_id
        await BaseMutationResolver.delete_entity(
            info, task, models.Task, "task", "patient", patient_id
        )
        return True


@strawberry.type
class TaskSubscription(BaseSubscriptionResolver):
    @strawberry.subscription
    async def task_created(
        self, info: Info
    ) -> AsyncGenerator[strawberry.ID, None]:
        async for task_id in BaseSubscriptionResolver.entity_created(info, "task"):
            yield task_id

    @strawberry.subscription
    async def task_updated(
        self,
        info: Info,
        task_id: strawberry.ID | None = None,
    ) -> AsyncGenerator[strawberry.ID, None]:
        async for updated_id in BaseSubscriptionResolver.entity_updated(info, "task", task_id):
            yield updated_id

    @strawberry.subscription
    async def task_deleted(
        self, info: Info
    ) -> AsyncGenerator[strawberry.ID, None]:
        async for task_id in BaseSubscriptionResolver.entity_deleted(info, "task"):
            yield task_id

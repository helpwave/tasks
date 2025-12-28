from collections.abc import AsyncGenerator

import strawberry
from api.audit import audit_log
from api.context import Info
from api.inputs import CreateTaskInput, UpdateTaskInput
from api.resolvers.base import BaseMutationResolver, BaseSubscriptionResolver
from api.services.authorization import AuthorizationService
from api.services.checksum import validate_checksum
from api.services.datetime import normalize_datetime_to_utc
from api.services.property import PropertyService
from api.types.task import TaskType
from database import models
from graphql import GraphQLError
from sqlalchemy import desc, select
from sqlalchemy.orm import aliased, selectinload


@strawberry.type
class TaskQuery:
    @strawberry.field
    async def task(self, info: Info, id: strawberry.ID) -> TaskType | None:
        result = await info.context.db.execute(
            select(models.Task)
            .where(models.Task.id == id)
            .options(selectinload(models.Task.patient).selectinload(models.Patient.assigned_locations))
        )
        task = result.scalars().first()
        if task and task.patient:
            auth_service = AuthorizationService(info.context.db)
            if not await auth_service.can_access_patient(info.context.user, task.patient, info.context):
                raise GraphQLError(
                    "Insufficient permission. Please contact an administrator if you believe this is an error.",
                    extensions={"code": "FORBIDDEN"},
                )
        return task

    @strawberry.field
    async def tasks(
        self,
        info: Info,
        patient_id: strawberry.ID | None = None,
        assignee_id: strawberry.ID | None = None,
        assignee_team_id: strawberry.ID | None = None,
        root_location_ids: list[strawberry.ID] | None = None,
    ) -> list[TaskType]:
        auth_service = AuthorizationService(info.context.db)

        if patient_id:
            if not await auth_service.can_access_patient_id(info.context.user, patient_id, info.context):
                raise GraphQLError(
                    "Insufficient permission. Please contact an administrator if you believe this is an error.",
                    extensions={"code": "FORBIDDEN"},
                )

            query = select(models.Task).options(
                selectinload(models.Task.patient).selectinload(models.Patient.assigned_locations)
            ).where(models.Task.patient_id == patient_id)

            if assignee_id:
                query = query.where(models.Task.assignee_id == assignee_id)
            if assignee_team_id:
                query = query.where(models.Task.assignee_team_id == assignee_team_id)

            result = await info.context.db.execute(query)
            return result.scalars().all()

        accessible_location_ids = await auth_service.get_user_accessible_location_ids(
            info.context.user, info.context
        )

        if not accessible_location_ids:
            return []

        patient_locations = aliased(models.patient_locations)
        patient_teams = aliased(models.patient_teams)

        cte = (
            select(models.LocationNode.id)
            .where(models.LocationNode.id.in_(accessible_location_ids))
            .cte(name="accessible_locations", recursive=True)
        )

        children = select(models.LocationNode.id).join(
            cte, models.LocationNode.parent_id == cte.c.id
        )
        cte = cte.union_all(children)

        if root_location_ids:
            invalid_ids = [lid for lid in root_location_ids if lid not in accessible_location_ids]
            if invalid_ids:
                raise GraphQLError(
                    "Insufficient permission. Please contact an administrator if you believe this is an error.",
                    extensions={"code": "FORBIDDEN"},
                )
            root_cte = (
                select(models.LocationNode.id)
                .where(models.LocationNode.id.in_(root_location_ids))
                .cte(name="root_location_descendants", recursive=True)
            )
            root_children = select(models.LocationNode.id).join(
                root_cte, models.LocationNode.parent_id == root_cte.c.id
            )
            root_cte = root_cte.union_all(root_children)
        else:
            root_cte = cte

        query = (
            select(models.Task)
            .options(
                selectinload(models.Task.patient).selectinload(models.Patient.assigned_locations)
            )
            .join(models.Patient, models.Task.patient_id == models.Patient.id)
            .outerjoin(
                patient_locations,
                models.Patient.id == patient_locations.c.patient_id,
            )
            .outerjoin(
                patient_teams,
                models.Patient.id == patient_teams.c.patient_id,
            )
            .where(
                (models.Patient.clinic_id.in_(select(root_cte.c.id)))
                | (
                    models.Patient.position_id.isnot(None)
                    & models.Patient.position_id.in_(select(root_cte.c.id))
                )
                | (
                    models.Patient.assigned_location_id.isnot(None)
                    & models.Patient.assigned_location_id.in_(select(root_cte.c.id))
                )
                | (patient_locations.c.location_id.in_(select(root_cte.c.id)))
                | (patient_teams.c.location_id.in_(select(root_cte.c.id)))
            )
            .distinct()
        )

        if assignee_id:
            query = query.where(models.Task.assignee_id == assignee_id)
        if assignee_team_id:
            query = query.where(models.Task.assignee_team_id == assignee_team_id)

        result = await info.context.db.execute(query)
        return result.scalars().all()

    @strawberry.field
    async def recent_tasks(
        self,
        info: Info,
        limit: int = 10,
    ) -> list[TaskType]:
        auth_service = AuthorizationService(info.context.db)
        accessible_location_ids = await auth_service.get_user_accessible_location_ids(
            info.context.user, info.context
        )

        if not accessible_location_ids:
            return []

        patient_locations = aliased(models.patient_locations)
        patient_teams = aliased(models.patient_teams)

        cte = (
            select(models.LocationNode.id)
            .where(models.LocationNode.id.in_(accessible_location_ids))
            .cte(name="accessible_locations", recursive=True)
        )

        children = select(models.LocationNode.id).join(
            cte, models.LocationNode.parent_id == cte.c.id
        )
        cte = cte.union_all(children)

        query = (
            select(models.Task)
            .options(
                selectinload(models.Task.patient).selectinload(models.Patient.assigned_locations)
            )
            .join(models.Patient, models.Task.patient_id == models.Patient.id)
            .outerjoin(
                patient_locations,
                models.Patient.id == patient_locations.c.patient_id,
            )
            .outerjoin(
                patient_teams,
                models.Patient.id == patient_teams.c.patient_id,
            )
            .where(
                (models.Patient.clinic_id.in_(select(cte.c.id)))
                | (
                    models.Patient.position_id.isnot(None)
                    & models.Patient.position_id.in_(select(cte.c.id))
                )
                | (
                    models.Patient.assigned_location_id.isnot(None)
                    & models.Patient.assigned_location_id.in_(select(cte.c.id))
                )
                | (patient_locations.c.location_id.in_(select(cte.c.id)))
                | (patient_teams.c.location_id.in_(select(cte.c.id)))
            )
            .order_by(desc(models.Task.update_date))
            .limit(limit)
            .distinct()
        )

        result = await info.context.db.execute(query)
        return result.scalars().all()


@strawberry.type
class TaskMutation(BaseMutationResolver[models.Task]):
    @staticmethod
    def _get_property_service(db) -> PropertyService:
        return PropertyService(db)

    @strawberry.mutation
    @audit_log("create_task")
    async def create_task(self, info: Info, data: CreateTaskInput) -> TaskType:
        auth_service = AuthorizationService(info.context.db)
        if not await auth_service.can_access_patient_id(info.context.user, data.patient_id, info.context):
            raise GraphQLError(
                "Insufficient permission. Please contact an administrator if you believe this is an error.",
                extensions={"code": "FORBIDDEN"},
            )

        if data.assignee_id and data.assignee_team_id:
            raise GraphQLError(
                "Cannot assign both a user and a team. Please assign either a user or a team.",
                extensions={"code": "BAD_REQUEST"},
            )

        new_task = models.Task(
            title=data.title,
            description=data.description,
            patient_id=data.patient_id,
            assignee_id=data.assignee_id,
            assignee_team_id=data.assignee_team_id if not data.assignee_id else None,
            due_date=normalize_datetime_to_utc(data.due_date),
            priority=data.priority.value if data.priority else None,
            estimated_time=data.estimated_time,
        )

        if data.properties is not None:
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
        result = await db.execute(
            select(models.Task)
            .where(models.Task.id == id)
            .options(selectinload(models.Task.patient).selectinload(models.Patient.assigned_locations))
        )
        task = result.scalars().first()
        if not task:
            raise Exception("Task not found")

        if task.patient:
            auth_service = AuthorizationService(db)
            if not await auth_service.can_access_patient(info.context.user, task.patient, info.context):
                raise GraphQLError(
                    "Insufficient permission. Please contact an administrator if you believe this is an error.",
                    extensions={"code": "FORBIDDEN"},
                )

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

        if data.priority is not strawberry.UNSET:
            task.priority = data.priority.value if data.priority else None

        if data.estimated_time is not strawberry.UNSET:
            task.estimated_time = data.estimated_time

        if data.assignee_id is not None and data.assignee_team_id is not strawberry.UNSET and data.assignee_team_id is not None:
            raise GraphQLError(
                "Cannot assign both a user and a team. Please assign either a user or a team.",
                extensions={"code": "BAD_REQUEST"},
            )

        if data.assignee_id is not None:
            task.assignee_id = data.assignee_id
            task.assignee_team_id = None
        elif data.assignee_team_id is not strawberry.UNSET:
            task.assignee_team_id = data.assignee_team_id
            task.assignee_id = None

        if data.properties is not None:
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
        db = info.context.db
        result = await db.execute(
            select(models.Task)
            .where(models.Task.id == id)
            .options(selectinload(models.Task.patient).selectinload(models.Patient.assigned_locations))
        )
        task = result.scalars().first()
        if not task:
            raise Exception("Task not found")

        if task.patient:
            auth_service = AuthorizationService(db)
            if not await auth_service.can_access_patient(info.context.user, task.patient, info.context):
                raise GraphQLError(
                    "Insufficient permission. Please contact an administrator if you believe this is an error.",
                    extensions={"code": "FORBIDDEN"},
                )

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
            lambda task: (
                setattr(task, "assignee_id", user_id),
                setattr(task, "assignee_team_id", None)
            ),
        )

    @strawberry.mutation
    @audit_log("unassign_task")
    async def unassign_task(self, info: Info, id: strawberry.ID) -> TaskType:
        return await TaskMutation._update_task_field(
            info,
            id,
            lambda task: (
                setattr(task, "assignee_id", None),
                setattr(task, "assignee_team_id", None)
            ),
        )

    @strawberry.mutation
    @audit_log("assign_task_to_team")
    async def assign_task_to_team(
        self,
        info: Info,
        id: strawberry.ID,
        team_id: strawberry.ID,
    ) -> TaskType:
        return await TaskMutation._update_task_field(
            info,
            id,
            lambda task: (
                setattr(task, "assignee_id", None),
                setattr(task, "assignee_team_id", team_id)
            ),
        )

    @strawberry.mutation
    @audit_log("unassign_task_from_team")
    async def unassign_task_from_team(self, info: Info, id: strawberry.ID) -> TaskType:
        return await TaskMutation._update_task_field(
            info,
            id,
            lambda task: (
                setattr(task, "assignee_id", None),
                setattr(task, "assignee_team_id", None)
            ),
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
        result = await db.execute(
            select(models.Task)
            .where(models.Task.id == id)
            .options(selectinload(models.Task.patient).selectinload(models.Patient.assigned_locations))
        )
        task = result.scalars().first()
        if not task:
            return False

        if task.patient:
            auth_service = AuthorizationService(db)
            if not await auth_service.can_access_patient(info.context.user, task.patient, info.context):
                raise GraphQLError(
                    "Insufficient permission. Please contact an administrator if you believe this is an error.",
                    extensions={"code": "FORBIDDEN"},
                )

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

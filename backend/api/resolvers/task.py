from collections.abc import AsyncGenerator
from typing import Any

import strawberry
from api.audit import audit_log
from api.context import Info
from api.errors import raise_forbidden
from api.inputs import (
    ApplyTaskGraphInput,
    CreateTaskInput,
    PaginationInput,
    PatientState,
    SortDirection,
    UpdateTaskInput,
)
from api.query.execute import count_unified_query, is_unset, unified_list_query
from api.query.inputs import (
    QueryFilterClauseInput,
    QuerySearchInput,
    QuerySortClauseInput,
)
from api.query.registry import TASK
from api.resolvers.base import BaseMutationResolver, BaseSubscriptionResolver
from api.services.authorization import AuthorizationService
from api.services.checksum import validate_checksum
from api.services.datetime import normalize_datetime_to_utc
from api.services.property import PropertyService
from api.services.task_graph import (
    apply_task_graph_to_patient,
    graph_dict_from_preset_inputs,
    insert_task_dependencies,
    replace_incoming_task_dependencies,
    validate_task_graph_dict,
)
from api.types.task import TaskType
from database import models
from database.models.task_preset import TaskPresetScope as DbTaskPresetScope
from graphql import GraphQLError
from sqlalchemy import and_, exists, or_, select
from sqlalchemy.orm import aliased, selectinload


def _assignee_match_clause(user_id: strawberry.ID | None):
    if not user_id:
        return None
    return exists(
        select(1).where(
            models.task_assignees.c.task_id == models.Task.id,
            models.task_assignees.c.user_id == user_id,
        )
    )


def _patient_visibility_clause(location_cte, patient_locations, patient_teams):
    return (
        (models.Patient.clinic_id.in_(select(location_cte.c.id)))
        | (
            models.Patient.position_id.isnot(None)
            & models.Patient.position_id.in_(select(location_cte.c.id))
        )
        | (
            models.Patient.assigned_location_id.isnot(None)
            & models.Patient.assigned_location_id.in_(
                select(location_cte.c.id),
            )
        )
        | (patient_locations.c.location_id.in_(select(location_cte.c.id)))
        | (patient_teams.c.location_id.in_(select(location_cte.c.id)))
    )


@strawberry.type
class TaskQuery:
    @strawberry.field
    async def task(self, info: Info, id: strawberry.ID) -> TaskType | None:
        result = await info.context.db.execute(
            select(models.Task)
            .where(models.Task.id == id)
            .options(
                selectinload(models.Task.patient).selectinload(
                    models.Patient.assigned_locations,
                ),
                selectinload(models.Task.assignees),
            ),
        )
        task = result.scalars().first()
        if task:
            auth_service = AuthorizationService(info.context.db)
            if not await auth_service.can_access_task(
                info.context.user,
                task,
                info.context,
            ):
                raise_forbidden()
        return task

    @strawberry.field
    @unified_list_query(TASK)
    async def tasks(
        self,
        info: Info,
        patient_id: strawberry.ID | None = None,
        assignee_id: strawberry.ID | None = None,
        assignee_team_id: strawberry.ID | None = None,
        root_location_ids: list[strawberry.ID] | None = None,
        filters: list[QueryFilterClauseInput] | None = None,
        sorts: list[QuerySortClauseInput] | None = None,
        pagination: PaginationInput | None = None,
        search: QuerySearchInput | None = None,
    ) -> list[TaskType]:
        auth_service = AuthorizationService(info.context.db)

        if patient_id:
            if not await auth_service.can_access_patient_id(
                info.context.user,
                patient_id,
                info.context,
            ):
                raise_forbidden()

            query = (
                select(models.Task)
                .options(
                    selectinload(models.Task.patient).selectinload(
                        models.Patient.assigned_locations,
                    ),
                    selectinload(models.Task.assignees),
                )
                .where(models.Task.patient_id == patient_id)
            )

            if assignee_id:
                query = query.where(
                    exists(
                        select(1).where(
                            models.task_assignees.c.task_id == models.Task.id,
                            models.task_assignees.c.user_id == assignee_id,
                        )
                    )
                )
            if assignee_team_id:
                query = query.where(
                    models.Task.assignee_team_id == assignee_team_id,
                )

            return query

        accessible_location_ids = (
            await auth_service.get_user_accessible_location_ids(
                info.context.user,
                info.context,
            )
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
            cte,
            models.LocationNode.parent_id == cte.c.id,
        )
        cte = cte.union_all(children)

        if root_location_ids:
            invalid_ids = [
                lid
                for lid in root_location_ids
                if lid not in accessible_location_ids
            ]
            if invalid_ids:
                raise_forbidden()
            root_cte = (
                select(models.LocationNode.id)
                .where(models.LocationNode.id.in_(root_location_ids))
                .cte(name="root_location_descendants", recursive=True)
            )
            root_children = select(models.LocationNode.id).join(
                root_cte,
                models.LocationNode.parent_id == root_cte.c.id,
            )
            root_cte = root_cte.union_all(root_children)
        else:
            root_cte = cte

        team_location_cte = None
        if assignee_team_id:
            if assignee_team_id not in accessible_location_ids:
                raise_forbidden()
            team_location_cte = (
                select(models.LocationNode.id)
                .where(models.LocationNode.id == assignee_team_id)
                .cte(name="team_location_descendants", recursive=True)
            )
            team_children = select(models.LocationNode.id).join(
                team_location_cte,
                models.LocationNode.parent_id == team_location_cte.c.id,
            )
            team_location_cte = team_location_cte.union_all(team_children)

        viewer_assignee_clause = _assignee_match_clause(
            info.context.user.id if info.context.user else None
        )
        no_patient_scope_clause = models.Task.assignee_team_id.in_(select(root_cte.c.id))
        if viewer_assignee_clause is not None:
            no_patient_scope_clause = or_(
                viewer_assignee_clause,
                no_patient_scope_clause,
            )

        query = (
            select(models.Task)
            .options(
                selectinload(models.Task.patient).selectinload(
                    models.Patient.assigned_locations,
                ),
                selectinload(models.Task.assignees),
            )
            .outerjoin(models.Patient, models.Task.patient_id == models.Patient.id)
            .outerjoin(
                patient_locations,
                models.Patient.id == patient_locations.c.patient_id,
            )
            .outerjoin(
                patient_teams,
                models.Patient.id == patient_teams.c.patient_id,
            )
            .where(
                (
                    and_(
                        models.Task.patient_id.isnot(None),
                        _patient_visibility_clause(root_cte, patient_locations, patient_teams),
                        models.Patient.state.notin_(
                            [PatientState.DISCHARGED.value, PatientState.DEAD.value]
                        ),
                    )
                )
                | and_(
                    models.Task.patient_id.is_(None),
                    no_patient_scope_clause,
                )
            )
            .distinct()
        )

        if assignee_id:
            query = query.where(
                exists(
                    select(1).where(
                        models.task_assignees.c.task_id == models.Task.id,
                        models.task_assignees.c.user_id == assignee_id,
                    )
                )
            )
        if assignee_team_id:
            query = query.where(
                models.Task.assignee_team_id.in_(
                    select(team_location_cte.c.id),
                ),
            )

        return query

    @strawberry.field
    async def tasksTotal(
        self,
        info: Info,
        patient_id: strawberry.ID | None = None,
        assignee_id: strawberry.ID | None = None,
        assignee_team_id: strawberry.ID | None = None,
        root_location_ids: list[strawberry.ID] | None = None,
        filters: list[QueryFilterClauseInput] | None = None,
        sorts: list[QuerySortClauseInput] | None = None,
        search: QuerySearchInput | None = None,
    ) -> int:
        auth_service = AuthorizationService(info.context.db)

        if patient_id:
            if not await auth_service.can_access_patient_id(
                info.context.user,
                patient_id,
                info.context,
            ):
                raise_forbidden()

            query = select(models.Task).where(
                models.Task.patient_id == patient_id,
            )

            if assignee_id:
                query = query.where(
                    exists(
                        select(1).where(
                            models.task_assignees.c.task_id == models.Task.id,
                            models.task_assignees.c.user_id == assignee_id,
                        )
                    )
                )
            if assignee_team_id:
                query = query.where(
                    models.Task.assignee_team_id == assignee_team_id,
                )
        else:
            accessible_location_ids = (
                await auth_service.get_user_accessible_location_ids(
                    info.context.user,
                    info.context,
                )
            )

            if not accessible_location_ids:
                return 0

            patient_locations = aliased(models.patient_locations)
            patient_teams = aliased(models.patient_teams)

            cte = (
                select(models.LocationNode.id)
                .where(models.LocationNode.id.in_(accessible_location_ids))
                .cte(name="accessible_locations", recursive=True)
            )

            children = select(models.LocationNode.id).join(
                cte,
                models.LocationNode.parent_id == cte.c.id,
            )
            cte = cte.union_all(children)

            if root_location_ids:
                invalid_ids = [
                    lid
                    for lid in root_location_ids
                    if lid not in accessible_location_ids
                ]
                if invalid_ids:
                    raise_forbidden()
                root_cte = (
                    select(models.LocationNode.id)
                    .where(models.LocationNode.id.in_(root_location_ids))
                    .cte(name="root_location_descendants", recursive=True)
                )
                root_children = select(models.LocationNode.id).join(
                    root_cte,
                    models.LocationNode.parent_id == root_cte.c.id,
                )
                root_cte = root_cte.union_all(root_children)
            else:
                root_cte = cte

            team_location_cte = None
            if assignee_team_id:
                if assignee_team_id not in accessible_location_ids:
                    raise_forbidden()
                team_location_cte = (
                    select(models.LocationNode.id)
                    .where(models.LocationNode.id == assignee_team_id)
                    .cte(name="team_location_descendants", recursive=True)
                )
                team_children = select(models.LocationNode.id).join(
                    team_location_cte,
                    models.LocationNode.parent_id == team_location_cte.c.id,
                )
                team_location_cte = team_location_cte.union_all(team_children)

            viewer_assignee_clause = _assignee_match_clause(
                info.context.user.id if info.context.user else None
            )
            no_patient_scope_clause = models.Task.assignee_team_id.in_(select(root_cte.c.id))
            if viewer_assignee_clause is not None:
                no_patient_scope_clause = or_(
                    viewer_assignee_clause,
                    no_patient_scope_clause,
                )

            query = (
                select(models.Task)
                .outerjoin(
                    models.Patient,
                    models.Task.patient_id == models.Patient.id,
                )
                .outerjoin(
                    patient_locations,
                    models.Patient.id == patient_locations.c.patient_id,
                )
                .outerjoin(
                    patient_teams,
                    models.Patient.id == patient_teams.c.patient_id,
                )
                .where(
                    (
                        and_(
                            models.Task.patient_id.isnot(None),
                            _patient_visibility_clause(
                                root_cte,
                                patient_locations,
                                patient_teams,
                            ),
                            models.Patient.state.notin_(
                                [PatientState.DISCHARGED.value, PatientState.DEAD.value]
                            ),
                        )
                    )
                    | and_(
                        models.Task.patient_id.is_(None),
                        no_patient_scope_clause,
                    )
                )
                .distinct()
            )

            if assignee_id:
                query = query.where(
                    exists(
                        select(1).where(
                            models.task_assignees.c.task_id == models.Task.id,
                            models.task_assignees.c.user_id == assignee_id,
                        )
                    )
                )
            if assignee_team_id:
                query = query.where(
                    models.Task.assignee_team_id.in_(
                        select(team_location_cte.c.id),
                    ),
                )

        return await count_unified_query(
            query,
            entity=TASK,
            db=info.context.db,
            filters=filters if filters is not None and not is_unset(filters) else None,
            sorts=sorts if sorts is not None and not is_unset(sorts) else None,
            search=search if search is not None and not is_unset(search) else None,
            info=info,
        )

    @strawberry.field
    @unified_list_query(
        TASK,
        default_sorts_when_empty=[
            QuerySortClauseInput(
                field_key="updateDate",
                direction=SortDirection.DESC,
            )
        ],
    )
    async def recent_tasks(
        self,
        info: Info,
        root_location_ids: list[strawberry.ID] | None = None,
        filters: list[QueryFilterClauseInput] | None = None,
        sorts: list[QuerySortClauseInput] | None = None,
        pagination: PaginationInput | None = None,
        search: QuerySearchInput | None = None,
    ) -> list[TaskType]:
        auth_service = AuthorizationService(info.context.db)
        accessible_location_ids = (
            await auth_service.get_user_accessible_location_ids(
                info.context.user,
                info.context,
            )
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
            cte,
            models.LocationNode.parent_id == cte.c.id,
        )
        cte = cte.union_all(children)

        if root_location_ids:
            invalid_ids = [
                lid
                for lid in root_location_ids
                if lid not in accessible_location_ids
            ]
            if invalid_ids:
                raise_forbidden()
            root_cte = (
                select(models.LocationNode.id)
                .where(models.LocationNode.id.in_(root_location_ids))
                .cte(name="recent_tasks_root_descendants", recursive=True)
            )
            root_children = select(models.LocationNode.id).join(
                root_cte,
                models.LocationNode.parent_id == root_cte.c.id,
            )
            root_cte = root_cte.union_all(root_children)
            location_cte = root_cte
        else:
            location_cte = cte

        viewer_assignee_clause = _assignee_match_clause(
            info.context.user.id if info.context.user else None
        )
        no_patient_scope_clause = models.Task.assignee_team_id.in_(select(location_cte.c.id))
        if viewer_assignee_clause is not None:
            no_patient_scope_clause = or_(
                viewer_assignee_clause,
                no_patient_scope_clause,
            )

        query = (
            select(models.Task)
            .options(
                selectinload(models.Task.patient).selectinload(
                    models.Patient.assigned_locations,
                ),
                selectinload(models.Task.assignees),
            )
            .outerjoin(models.Patient, models.Task.patient_id == models.Patient.id)
            .outerjoin(
                patient_locations,
                models.Patient.id == patient_locations.c.patient_id,
            )
            .outerjoin(
                patient_teams,
                models.Patient.id == patient_teams.c.patient_id,
            )
            .where(
                (
                    and_(
                        models.Task.patient_id.isnot(None),
                        _patient_visibility_clause(
                            location_cte,
                            patient_locations,
                            patient_teams,
                        ),
                        models.Patient.state.notin_(
                            [PatientState.DISCHARGED.value, PatientState.DEAD.value]
                        ),
                    )
                )
                | and_(
                    models.Task.patient_id.is_(None),
                    no_patient_scope_clause,
                )
            )
            .distinct()
        )

        return query

    @strawberry.field
    async def recentTasksTotal(
        self,
        info: Info,
        root_location_ids: list[strawberry.ID] | None = None,
        filters: list[QueryFilterClauseInput] | None = None,
        sorts: list[QuerySortClauseInput] | None = None,
        search: QuerySearchInput | None = None,
    ) -> int:
        auth_service = AuthorizationService(info.context.db)
        accessible_location_ids = (
            await auth_service.get_user_accessible_location_ids(
                info.context.user,
                info.context,
            )
        )

        if not accessible_location_ids:
            return 0

        patient_locations = aliased(models.patient_locations)
        patient_teams = aliased(models.patient_teams)

        cte = (
            select(models.LocationNode.id)
            .where(models.LocationNode.id.in_(accessible_location_ids))
            .cte(name="accessible_locations", recursive=True)
        )

        children = select(models.LocationNode.id).join(
            cte,
            models.LocationNode.parent_id == cte.c.id,
        )
        cte = cte.union_all(children)

        if root_location_ids:
            invalid_ids = [
                lid
                for lid in root_location_ids
                if lid not in accessible_location_ids
            ]
            if invalid_ids:
                raise_forbidden()
            root_cte = (
                select(models.LocationNode.id)
                .where(models.LocationNode.id.in_(root_location_ids))
                .cte(name="recent_tasks_total_root", recursive=True)
            )
            root_children = select(models.LocationNode.id).join(
                root_cte,
                models.LocationNode.parent_id == root_cte.c.id,
            )
            root_cte = root_cte.union_all(root_children)
            location_cte = root_cte
        else:
            location_cte = cte

        viewer_assignee_clause = _assignee_match_clause(
            info.context.user.id if info.context.user else None
        )
        no_patient_scope_clause = models.Task.assignee_team_id.in_(select(location_cte.c.id))
        if viewer_assignee_clause is not None:
            no_patient_scope_clause = or_(
                viewer_assignee_clause,
                no_patient_scope_clause,
            )

        query = (
            select(models.Task)
            .outerjoin(models.Patient, models.Task.patient_id == models.Patient.id)
            .outerjoin(
                patient_locations,
                models.Patient.id == patient_locations.c.patient_id,
            )
            .outerjoin(
                patient_teams,
                models.Patient.id == patient_teams.c.patient_id,
            )
            .where(
                (
                    and_(
                        models.Task.patient_id.isnot(None),
                        _patient_visibility_clause(
                            location_cte,
                            patient_locations,
                            patient_teams,
                        ),
                        models.Patient.state.notin_(
                            [PatientState.DISCHARGED.value, PatientState.DEAD.value]
                        ),
                    )
                )
                | and_(
                    models.Task.patient_id.is_(None),
                    no_patient_scope_clause,
                )
            )
            .distinct()
        )

        return await count_unified_query(
            query,
            entity=TASK,
            db=info.context.db,
            filters=filters if filters is not None and not is_unset(filters) else None,
            sorts=sorts if sorts is not None and not is_unset(sorts) else None,
            search=search if search is not None and not is_unset(search) else None,
            info=info,
        )


@strawberry.type
class TaskMutation(BaseMutationResolver[models.Task]):
    @staticmethod
    def _get_property_service(db) -> PropertyService:
        return PropertyService(db)

    @staticmethod
    async def _users_by_ids(info: Info, user_ids: list[strawberry.ID] | None) -> list[models.User]:
        if not user_ids:
            return []
        result = await info.context.db.execute(
            select(models.User).where(models.User.id.in_(user_ids))
        )
        users = result.scalars().all()
        if len(users) != len(set(str(user_id) for user_id in user_ids)):
            raise GraphQLError(
                "One or more assignee users were not found.",
                extensions={"code": "BAD_REQUEST"},
            )
        return users

    @staticmethod
    def _validate_task_scope(
        patient_id: strawberry.ID | None,
        assignee_count: int,
        assignee_team_id: strawberry.ID | None,
    ) -> None:
        if assignee_count > 0 and assignee_team_id is not None:
            raise GraphQLError(
                "Cannot assign both users and a team. Please assign either users or a team.",
                extensions={"code": "BAD_REQUEST"},
            )
        if patient_id is None and assignee_count == 0 and assignee_team_id is None:
            raise GraphQLError(
                "Task must have a patient, assignees, or an assignee team.",
                extensions={"code": "BAD_REQUEST"},
            )

    @strawberry.mutation
    @audit_log("create_task")
    async def create_task(self, info: Info, data: CreateTaskInput) -> TaskType:
        auth_service = AuthorizationService(info.context.db)
        if data.patient_id and not await auth_service.can_access_patient_id(
            info.context.user,
            data.patient_id,
            info.context,
        ):
            raise_forbidden()

        assignees = await TaskMutation._users_by_ids(info, data.assignee_ids)
        TaskMutation._validate_task_scope(
            data.patient_id,
            len(assignees),
            data.assignee_team_id,
        )

        new_task = models.Task(
            title=data.title,
            description=data.description,
            patient_id=data.patient_id,
            assignees=assignees,
            assignee_team_id=(data.assignee_team_id if len(assignees) == 0 else None),
            due_date=normalize_datetime_to_utc(data.due_date),
            priority=data.priority.value if data.priority else None,
            estimated_time=data.estimated_time,
        )

        if data.properties is not None:
            property_service = TaskMutation._get_property_service(
                info.context.db,
            )
            await property_service.process_properties(
                new_task,
                data.properties,
                "task",
            )

        task = await BaseMutationResolver.create_and_notify(
            info,
            new_task,
            models.Task,
            "task",
            "patient" if new_task.patient_id else None,
            new_task.patient_id or None,
        )
        if task.patient_id:
            from api.audit import AuditLogger

            AuditLogger.log_activity(
                case_id=task.patient_id,
                activity_name="task_created",
                user_id=info.context.user.id if info.context.user else None,
                context={
                    "payload": {"task_id": task.id, "task_title": task.title},
                },
            )
        if data.previous_task_ids:
            await insert_task_dependencies(
                info.context.db,
                task.id,
                [str(x) for x in data.previous_task_ids],
                str(task.patient_id),
            )
            await info.context.db.commit()
        return task

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
            .options(
                selectinload(models.Task.patient).selectinload(
                    models.Patient.assigned_locations,
                ),
                selectinload(models.Task.assignees),
            ),
        )
        task = result.scalars().first()
        if not task:
            raise Exception("Task not found")

        auth_service = AuthorizationService(db)
        if not await auth_service.can_access_task(
            info.context.user,
            task,
            info.context,
        ):
            raise_forbidden()

        if data.checksum:
            validate_checksum(task, data.checksum, "Task")

        if data.title is not None:
            task.title = data.title
        if data.description is not None:
            task.description = data.description
        if data.patient_id is not strawberry.UNSET:
            if data.patient_id and not await auth_service.can_access_patient_id(
                info.context.user,
                data.patient_id,
                info.context,
            ):
                raise_forbidden()
            task.patient_id = data.patient_id
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

        next_assignees = task.assignees
        if data.assignee_ids is not strawberry.UNSET:
            next_assignees = await TaskMutation._users_by_ids(info, data.assignee_ids)
            task.assignees = next_assignees

        next_assignee_team_id = task.assignee_team_id
        if data.assignee_team_id is not strawberry.UNSET:
            next_assignee_team_id = data.assignee_team_id
            task.assignee_team_id = data.assignee_team_id
            if data.assignee_team_id is not None:
                task.assignees = []
                next_assignees = []
        elif data.assignee_ids is not strawberry.UNSET and len(next_assignees) > 0:
            task.assignee_team_id = None
            next_assignee_team_id = None

        TaskMutation._validate_task_scope(
            task.patient_id,
            len(next_assignees),
            next_assignee_team_id,
        )

        if data.properties is not None:
            property_service = TaskMutation._get_property_service(db)
            await property_service.process_properties(
                task,
                data.properties,
                "task",
            )

        result = await BaseMutationResolver.update_and_notify(
            info,
            task,
            models.Task,
            "task",
            "patient",
            task.patient_id,
        )
        if data.previous_task_ids is not None:
            await replace_incoming_task_dependencies(
                info.context.db,
                str(id),
                [str(x) for x in data.previous_task_ids],
                str(task.patient_id),
            )
            await info.context.db.commit()
        return result

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
            .options(
                selectinload(models.Task.patient).selectinload(
                    models.Patient.assigned_locations,
                ),
                selectinload(models.Task.assignees),
            ),
        )
        task = result.scalars().first()
        if not task:
            raise Exception("Task not found")

        auth_service = AuthorizationService(db)
        if not await auth_service.can_access_task(
            info.context.user,
            task,
            info.context,
        ):
            raise_forbidden()

        field_updater(task)
        TaskMutation._validate_task_scope(
            task.patient_id,
            len(task.assignees),
            task.assignee_team_id,
        )
        await BaseMutationResolver.update_and_notify(
            info,
            task,
            models.Task,
            "task",
            "patient",
            task.patient_id,
        )
        return task

    @strawberry.mutation
    @audit_log("add_task_assignee")
    async def add_task_assignee(
        self,
        info: Info,
        id: strawberry.ID,
        user_id: strawberry.ID,
    ) -> TaskType:
        user_result = await info.context.db.execute(
            select(models.User).where(models.User.id == user_id)
        )
        user = user_result.scalars().first()
        if user is None:
            raise GraphQLError(
                "Assignee user was not found.",
                extensions={"code": "BAD_REQUEST"},
            )
        return await TaskMutation._update_task_field(
            info,
            id,
            lambda task: (
                setattr(task, "assignee_team_id", None),
                task.assignees.append(user) if user not in task.assignees else None,
            ),
        )

    @strawberry.mutation
    @audit_log("remove_task_assignee")
    async def remove_task_assignee(
        self,
        info: Info,
        id: strawberry.ID,
        user_id: strawberry.ID,
    ) -> TaskType:
        return await TaskMutation._update_task_field(
            info,
            id,
            lambda task: setattr(
                task,
                "assignees",
                [assignee for assignee in task.assignees if assignee.id != user_id],
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
                setattr(task, "assignee_team_id", team_id),
                setattr(task, "assignees", []),
            ),
        )

    @strawberry.mutation
    @audit_log("unassign_task_from_team")
    async def unassign_task_from_team(
        self,
        info: Info,
        id: strawberry.ID,
    ) -> TaskType:
        return await TaskMutation._update_task_field(
            info,
            id,
            lambda task: (
                setattr(task, "assignee_team_id", None),
            ),
        )

    @strawberry.mutation
    @audit_log("complete_task")
    async def complete_task(self, info: Info, id: strawberry.ID) -> TaskType:
        task = await TaskMutation._update_task_field(
            info,
            id,
            lambda task: setattr(task, "done", True),
        )
        if task.patient_id:
            from api.audit import AuditLogger

            AuditLogger.log_activity(
                case_id=task.patient_id,
                activity_name="task_completed",
                user_id=info.context.user.id if info.context.user else None,
                context={
                    "payload": {"task_id": task.id, "task_title": task.title},
                },
            )
        return task

    @strawberry.mutation
    @audit_log("reopen_task")
    async def reopen_task(self, info: Info, id: strawberry.ID) -> TaskType:
        return await TaskMutation._update_task_field(
            info,
            id,
            lambda task: setattr(task, "done", False),
        )

    @strawberry.mutation
    @audit_log("apply_task_graph")
    async def apply_task_graph(
        self,
        info: Info,
        data: ApplyTaskGraphInput,
    ) -> list[TaskType]:
        user = info.context.user
        if not user:
            raise GraphQLError(
                "Not authenticated",
                extensions={"code": "UNAUTHENTICATED"},
            )
        auth_service = AuthorizationService(info.context.db)
        if not await auth_service.can_access_patient_id(
            user,
            data.patient_id,
            info.context,
        ):
            raise_forbidden()
        has_preset = data.preset_id is not None
        has_graph = data.graph is not None
        if has_preset == has_graph:
            raise GraphQLError(
                "Provide exactly one of presetId or graph",
                extensions={"code": "BAD_REQUEST"},
            )
        if data.preset_id and data.source_preset_id is not None:
            raise GraphQLError(
                "sourcePresetId is only allowed when graph is provided",
                extensions={"code": "BAD_REQUEST"},
            )
        graph_dict: dict[str, Any]
        if data.preset_id:
            pr = await info.context.db.execute(
                select(models.TaskPreset).where(
                    models.TaskPreset.id == data.preset_id,
                ),
            )
            preset = pr.scalars().first()
            if not preset:
                raise GraphQLError(
                    "Preset not found",
                    extensions={"code": "NOT_FOUND"},
                )
            if (
                preset.scope == DbTaskPresetScope.PERSONAL.value
                and preset.owner_user_id != user.id
            ):
                raise_forbidden()
            graph_dict = preset.graph_json
        else:
            graph_dict = graph_dict_from_preset_inputs(
                data.graph.nodes,
                data.graph.edges,
            )
            validate_task_graph_dict(graph_dict)
        assignee_id = user.id if data.assign_to_current_user else None
        source_preset_id: str | None
        if data.preset_id:
            source_preset_id = str(data.preset_id)
        elif data.source_preset_id is not None:
            pr_src = await info.context.db.execute(
                select(models.TaskPreset).where(
                    models.TaskPreset.id == data.source_preset_id,
                ),
            )
            preset_src = pr_src.scalars().first()
            if not preset_src:
                raise GraphQLError(
                    "Preset not found",
                    extensions={"code": "NOT_FOUND"},
                )
            if (
                preset_src.scope == DbTaskPresetScope.PERSONAL.value
                and preset_src.owner_user_id != user.id
            ):
                raise_forbidden()
            source_preset_id = str(data.source_preset_id)
        else:
            source_preset_id = None
        return await apply_task_graph_to_patient(
            info.context.db,
            str(data.patient_id),
            graph_dict,
            assignee_id,
            source_preset_id,
        )

    @strawberry.mutation
    @audit_log("delete_task")
    async def delete_task(self, info: Info, id: strawberry.ID) -> bool:
        db = info.context.db
        result = await db.execute(
            select(models.Task)
            .where(models.Task.id == id)
            .options(
                selectinload(models.Task.patient).selectinload(
                    models.Patient.assigned_locations,
                ),
                selectinload(models.Task.assignees),
            ),
        )
        task = result.scalars().first()
        if not task:
            return False

        auth_service = AuthorizationService(db)
        if not await auth_service.can_access_task(
            info.context.user,
            task,
            info.context,
        ):
            raise_forbidden()

        patient_id = task.patient_id
        await BaseMutationResolver.delete_entity(
            info,
            task,
            models.Task,
            "task",
            "patient",
            patient_id,
        )
        return True


@strawberry.type
class TaskSubscription(BaseSubscriptionResolver):
    @strawberry.subscription
    async def task_created(
        self,
        info: Info,
        root_location_ids: list[strawberry.ID] | None = None,
    ) -> AsyncGenerator[strawberry.ID, None]:
        from api.services.subscription import (
            subscribe_with_location_filter,
            task_belongs_to_root_locations,
        )

        root_location_ids_str = (
            [str(lid) for lid in root_location_ids]
            if root_location_ids
            else None
        )
        base = BaseSubscriptionResolver.entity_created(info, "task")
        async for task_id in subscribe_with_location_filter(
            base,
            info.context.db,
            root_location_ids_str,
            task_belongs_to_root_locations,
        ):
            yield task_id

    @strawberry.subscription
    async def task_updated(
        self,
        info: Info,
        task_id: strawberry.ID | None = None,
        root_location_ids: list[strawberry.ID] | None = None,
    ) -> AsyncGenerator[strawberry.ID, None]:
        from api.services.subscription import (
            subscribe_with_location_filter,
            task_belongs_to_root_locations,
        )

        root_location_ids_str = (
            [str(lid) for lid in root_location_ids]
            if root_location_ids
            else None
        )
        base = BaseSubscriptionResolver.entity_updated(
            info,
            "task",
            task_id,
        )
        async for updated_id in subscribe_with_location_filter(
            base,
            info.context.db,
            root_location_ids_str,
            task_belongs_to_root_locations,
        ):
            yield updated_id

    @strawberry.subscription
    async def task_deleted(
        self,
        info: Info,
        root_location_ids: list[strawberry.ID] | None = None,
    ) -> AsyncGenerator[strawberry.ID, None]:
        from api.services.subscription import (
            subscribe_with_location_filter,
            task_belongs_to_root_locations,
        )

        root_location_ids_str = (
            [str(lid) for lid in root_location_ids]
            if root_location_ids
            else None
        )
        base = BaseSubscriptionResolver.entity_deleted(info, "task")
        async for task_id in subscribe_with_location_filter(
            base,
            info.context.db,
            root_location_ids_str,
            task_belongs_to_root_locations,
        ):
            yield task_id

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload

from database import models


class AuthorizationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_accessible_location_ids(
        self, user: models.User | None, context=None
    ) -> set[str]:
        if context and hasattr(context, '_accessible_location_ids') and context._accessible_location_ids is not None:
            return context._accessible_location_ids

        if not context or not hasattr(context, '_accessible_location_ids_lock'):
            return await self._compute_accessible_location_ids(user, context)

        async with context._accessible_location_ids_lock:
            if context._accessible_location_ids is not None:
                return context._accessible_location_ids
            return await self._compute_accessible_location_ids(user, context)

    async def _compute_accessible_location_ids(
        self, user: models.User | None, context=None
    ) -> set[str]:
        if not user:
            result = set()
            if context:
                context._accessible_location_ids = result
            return result

        result = await self.db.execute(
            select(models.user_root_locations.c.location_id).where(
                models.user_root_locations.c.user_id == user.id
            )
        )
        rows = result.fetchall()
        root_location_ids = {row[0] for row in rows}

        if not root_location_ids:
            result = set()
            if context:
                context._accessible_location_ids = result
            return result

        accessible_ids = await self._collect_descendant_ids(root_location_ids)

        if context:
            context._accessible_location_ids = accessible_ids

        return accessible_ids

    async def _collect_descendant_ids(self, node_ids: set[str]) -> set[str]:
        if not node_ids:
            return set()
        cte = (
            select(models.LocationNode.id)
            .where(models.LocationNode.id.in_(node_ids))
            .cte(name="accessible_locations", recursive=True)
        )
        children = select(models.LocationNode.id).join(
            cte, models.LocationNode.parent_id == cte.c.id
        )
        cte = cte.union_all(children)
        result = await self.db.execute(select(cte.c.id))
        return {row[0] for row in result.fetchall()}

    async def _collect_ancestor_ids(self, node_ids: set[str]) -> set[str]:
        if not node_ids:
            return set()
        cte = (
            select(models.LocationNode.id, models.LocationNode.parent_id)
            .where(models.LocationNode.id.in_(node_ids))
            .cte(name="ancestor_locations", recursive=True)
        )
        parents = select(models.LocationNode.id, models.LocationNode.parent_id).join(
            cte, models.LocationNode.id == cte.c.parent_id
        )
        cte = cte.union_all(parents)
        result = await self.db.execute(select(cte.c.id))
        return {row[0] for row in result.fetchall()}

    async def get_user_root_location_ids(self, user: models.User | None) -> set[str]:
        if not user:
            return set()
        result = await self.db.execute(
            select(models.user_root_locations.c.location_id).where(
                models.user_root_locations.c.user_id == user.id
            )
        )
        return {row[0] for row in result.fetchall()}

    async def get_scope_location_ids(
        self,
        user: models.User | None,
        context=None,
        root_location_ids: list[str] | None = None,
    ) -> set[str]:
        if not user:
            return set()
        accessible = await self.get_user_accessible_location_ids(user, context)
        if not accessible:
            return set()

        requested = [str(lid) for lid in root_location_ids or []]
        cache_key = tuple(sorted(requested))
        cache = getattr(context, "_scope_location_ids_cache", None)
        if cache is not None and cache_key in cache:
            return cache[cache_key]

        if requested:
            roots = {lid for lid in requested if lid in accessible}
            if not roots:
                scope: set[str] = set()
            else:
                scope = await self._collect_descendant_ids(roots)
                scope |= await self._collect_ancestor_ids(roots)
        else:
            roots = await self.get_user_root_location_ids(user)
            scope = set(accessible) | await self._collect_ancestor_ids(roots)

        if context is not None:
            if cache is None:
                cache = {}
                context._scope_location_ids_cache = cache
            cache[cache_key] = scope
        return scope

    async def can_access_location(
        self,
        user: models.User | None,
        location_id: str | None,
        context=None,
    ) -> bool:
        if not user or not location_id:
            return False
        accessible = await self.get_user_accessible_location_ids(user, context)
        return location_id in accessible

    async def default_scope_location_id(
        self, user: models.User | None, context=None
    ) -> str | None:
        if not user:
            return None
        result = await self.db.execute(
            select(models.user_root_locations.c.location_id)
            .where(models.user_root_locations.c.user_id == user.id)
            .order_by(models.user_root_locations.c.location_id.asc())
        )
        rows = result.fetchall()
        return rows[0][0] if rows else None

    async def can_access_patient(
        self, user: models.User | None, patient: models.Patient, context=None
    ) -> bool:
        if not user:
            return False

        accessible_location_ids = await self.get_user_accessible_location_ids(user, context)

        if not accessible_location_ids:
            return False

        if patient.clinic_id in accessible_location_ids:
            return True

        if patient.position_id and patient.position_id in accessible_location_ids:
            return True

        if (
            patient.assigned_location_id
            and patient.assigned_location_id in accessible_location_ids
        ):
            return True

        if patient.assigned_locations:
            for location in patient.assigned_locations:
                if location.id in accessible_location_ids:
                    return True

        if patient.teams:
            for team in patient.teams:
                if team.id in accessible_location_ids:
                    return True

        return False

    async def can_access_patient_id(
        self, user: models.User | None, patient_id: str, context=None
    ) -> bool:
        if not user:
            return False

        result = await self.db.execute(
            select(models.Patient)
            .where(models.Patient.id == patient_id)
            .options(
                selectinload(models.Patient.assigned_locations),
                selectinload(models.Patient.teams),
            )
        )
        patient = result.scalars().first()

        if not patient:
            return False

        return await self.can_access_patient(user, patient, context)

    async def can_access_task(
        self,
        user: models.User | None,
        task: models.Task,
        context=None,
    ) -> bool:
        if not user:
            return False

        if task.patient_id:
            if task.patient is not None:
                return await self.can_access_patient(user, task.patient, context)
            return await self.can_access_patient_id(user, task.patient_id, context)

        result = await self.db.execute(
            select(models.task_assignees.c.user_id).where(
                models.task_assignees.c.task_id == task.id,
                models.task_assignees.c.user_id == user.id,
            )
        )
        if result.first() is not None:
            return True

        if task.assignee_team_id:
            accessible_location_ids = await self.get_user_accessible_location_ids(user, context)
            return task.assignee_team_id in accessible_location_ids

        return False

    def filter_patients_by_access(
        self, user: models.User | None, query, accessible_location_ids: set[str] | None = None
    ):
        if not user:
            return query.where(False)

        if accessible_location_ids is None:
            return query

        if not accessible_location_ids:
            return query.where(False)

        cte = (
            select(models.LocationNode.id)
            .where(models.LocationNode.id.in_(accessible_location_ids))
            .cte(name="accessible_locations", recursive=True)
        )

        children = select(models.LocationNode.id).join(
            cte, models.LocationNode.parent_id == cte.c.id
        )
        cte = cte.union_all(children)

        patient_locations = aliased(models.patient_locations)
        patient_teams = aliased(models.patient_teams)

        expanded = (
            query.outerjoin(
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
        )
        opts = getattr(expanded, "_with_options", None) or ()
        ids_sq = expanded.with_only_columns(models.Patient.id).distinct().scalar_subquery()
        out = select(models.Patient).where(models.Patient.id.in_(ids_sq))
        for opt in opts:
            out = out.options(opt)
        return out

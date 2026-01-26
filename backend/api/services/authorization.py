from config import ALLOW_UNAUTHENTICATED_ACCESS, IS_DEV
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
        if IS_DEV and ALLOW_UNAUTHENTICATED_ACCESS:
            result = await self.db.execute(select(models.LocationNode.id))
            rows = result.fetchall()
            return {row[0] for row in rows}
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

        cte = (
            select(models.LocationNode.id)
            .where(models.LocationNode.id.in_(root_location_ids))
            .cte(name="accessible_locations", recursive=True)
        )

        children = select(models.LocationNode.id).join(
            cte, models.LocationNode.parent_id == cte.c.id
        )
        cte = cte.union_all(children)

        result = await self.db.execute(select(cte.c.id))
        rows = result.fetchall()
        accessible_ids = {row[0] for row in rows}

        if context:
            context._accessible_location_ids = accessible_ids

        return accessible_ids

    async def can_access_patient(
        self, user: models.User | None, patient: models.Patient, context=None
    ) -> bool:
        if IS_DEV and ALLOW_UNAUTHENTICATED_ACCESS:
            return True
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
        if IS_DEV and ALLOW_UNAUTHENTICATED_ACCESS:
            return True
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

    def filter_patients_by_access(
        self, user: models.User | None, query, accessible_location_ids: set[str] | None = None
    ):
        if IS_DEV and ALLOW_UNAUTHENTICATED_ACCESS:
            return query
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

        return (
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
            .distinct()
        )

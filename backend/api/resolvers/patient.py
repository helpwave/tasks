from collections.abc import AsyncGenerator

import strawberry
from api.audit import audit_log
from api.context import Info
from api.inputs import CreatePatientInput, PatientState, UpdatePatientInput
from api.resolvers.base import BaseMutationResolver, BaseSubscriptionResolver
from api.services.authorization import AuthorizationService
from api.services.checksum import validate_checksum
from api.services.location import LocationService
from api.services.property import PropertyService
from api.types.patient import PatientType
from database import models
from graphql import GraphQLError
from sqlalchemy import select
from sqlalchemy.orm import aliased, selectinload


@strawberry.type
class PatientQuery:
    @strawberry.field
    async def patient(
        self,
        info: Info,
        id: strawberry.ID,
    ) -> PatientType | None:
        result = await info.context.db.execute(
            select(models.Patient)
            .where(models.Patient.id == id)
            .where(models.Patient.deleted.is_(False))
            .options(
                selectinload(models.Patient.assigned_locations),
                selectinload(models.Patient.tasks),
                selectinload(models.Patient.teams),
            ),
        )
        patient = result.scalars().first()
        if patient:
            auth_service = AuthorizationService(info.context.db)
            if not await auth_service.can_access_patient(info.context.user, patient, info.context):
                raise GraphQLError(
                    "Insufficient permission. Please contact an administrator if you believe this is an error.",
                    extensions={"code": "FORBIDDEN"},
                )
        return patient

    @strawberry.field
    async def patients(
        self,
        info: Info,
        location_node_id: strawberry.ID | None = None,
        root_location_ids: list[strawberry.ID] | None = None,
        states: list[PatientState] | None = None,
    ) -> list[PatientType]:
        query = select(models.Patient).options(
            selectinload(models.Patient.assigned_locations),
            selectinload(models.Patient.tasks),
            selectinload(models.Patient.teams),
        ).where(models.Patient.deleted.is_(False))

        if states:
            state_values = [s.value for s in states]
            query = query.where(models.Patient.state.in_(state_values))
        else:
            query = query.where(
                models.Patient.state == PatientState.ADMITTED.value
            )
        auth_service = AuthorizationService(info.context.db)
        accessible_location_ids = await auth_service.get_user_accessible_location_ids(
            info.context.user, info.context
        )

        # If user has no accessible locations, return empty list
        if not accessible_location_ids:
            return []

        query = auth_service.filter_patients_by_access(
            info.context.user, query, accessible_location_ids
        )

        filter_cte = None
        if root_location_ids:
            # Filter to only include root_location_ids that the user has access to
            valid_root_location_ids = [lid for lid in root_location_ids if lid in accessible_location_ids]
            if not valid_root_location_ids:
                # If none of the requested root_location_ids are accessible, return empty list
                return []
            root_location_ids = valid_root_location_ids
            filter_cte = (
                select(models.LocationNode.id)
                .where(models.LocationNode.id.in_(root_location_ids))
                .cte(name="root_location_descendants", recursive=True)
            )
            root_children = select(models.LocationNode.id).join(
                filter_cte, models.LocationNode.parent_id == filter_cte.c.id
            )
            filter_cte = filter_cte.union_all(root_children)
        elif location_node_id:
            filter_cte = (
                select(models.LocationNode.id)
                .where(models.LocationNode.id == location_node_id)
                .cte(name="location_descendants", recursive=True)
            )
            parent = select(models.LocationNode.id).join(
                filter_cte,
                models.LocationNode.parent_id == filter_cte.c.id,
            )
            filter_cte = filter_cte.union_all(parent)

        if filter_cte is not None:
            patient_locations_filter = aliased(models.patient_locations)
            patient_teams_filter = aliased(models.patient_teams)

            query = (
                query.outerjoin(
                    patient_locations_filter,
                    models.Patient.id == patient_locations_filter.c.patient_id,
                )
                .outerjoin(
                    patient_teams_filter,
                    models.Patient.id == patient_teams_filter.c.patient_id,
                )
                .where(
                    (models.Patient.clinic_id.in_(select(filter_cte.c.id)))
                    | (
                        models.Patient.position_id.isnot(None)
                        & models.Patient.position_id.in_(select(filter_cte.c.id))
                    )
                    | (
                        models.Patient.assigned_location_id.isnot(None)
                        & models.Patient.assigned_location_id.in_(select(filter_cte.c.id))
                    )
                    | (patient_locations_filter.c.location_id.in_(select(filter_cte.c.id)))
                    | (patient_teams_filter.c.location_id.in_(select(filter_cte.c.id)))
                )
                .distinct()
            )

        result = await info.context.db.execute(query)
        return result.scalars().all()

    @strawberry.field
    async def recent_patients(
        self,
        info: Info,
        limit: int = 5,
    ) -> list[PatientType]:
        query = (
            select(models.Patient)
            .options(
                selectinload(models.Patient.assigned_locations),
                selectinload(models.Patient.tasks),
                selectinload(models.Patient.teams),
            )
            .where(models.Patient.deleted.is_(False))
            .limit(limit)
        )
        auth_service = AuthorizationService(info.context.db)
        accessible_location_ids = await auth_service.get_user_accessible_location_ids(
            info.context.user, info.context
        )
        query = auth_service.filter_patients_by_access(
            info.context.user, query, accessible_location_ids
        )
        result = await info.context.db.execute(query)
        return result.scalars().all()


@strawberry.type
class PatientMutation(BaseMutationResolver[models.Patient]):
    @staticmethod
    def _get_property_service(db) -> PropertyService:
        return PropertyService(db)

    @staticmethod
    def _get_location_service(db) -> LocationService:
        return LocationService(db)

    @strawberry.mutation
    @audit_log("create_patient")
    async def create_patient(
        self,
        info: Info,
        data: CreatePatientInput,
    ) -> PatientType:
        db = info.context.db
        location_service = PatientMutation._get_location_service(db)
        initial_state = (
            data.state.value if data.state else PatientState.WAIT.value
        )

        auth_service = AuthorizationService(db)
        accessible_location_ids = await auth_service.get_user_accessible_location_ids(
            info.context.user, info.context
        )

        if not accessible_location_ids:
            raise GraphQLError(
                "Insufficient permission. Please contact an administrator if you believe this is an error.",
                extensions={"code": "FORBIDDEN"},
            )

        if data.clinic_id not in accessible_location_ids:
            raise GraphQLError(
                "Insufficient permission. Please contact an administrator if you believe this is an error.",
                extensions={"code": "FORBIDDEN"},
            )

        await location_service.validate_and_get_clinic(data.clinic_id)

        if data.position_id:
            if data.position_id not in accessible_location_ids:
                raise GraphQLError(
                    "Insufficient permission. Please contact an administrator if you believe this is an error.",
                    extensions={"code": "FORBIDDEN"},
                )
            await location_service.validate_and_get_position(data.position_id)

        teams = []
        if data.team_ids:
            for team_id in data.team_ids:
                if team_id not in accessible_location_ids:
                    raise GraphQLError(
                        "Insufficient permission. Please contact an administrator if you believe this is an error.",
                        extensions={"code": "FORBIDDEN"},
                    )
            teams = await location_service.validate_and_get_teams(
                data.team_ids
            )

        new_patient = models.Patient(
            firstname=data.firstname,
            lastname=data.lastname,
            birthdate=data.birthdate,
            sex=data.sex.value,
            state=initial_state,
            assigned_location_id=data.assigned_location_id,
            clinic_id=data.clinic_id,
            position_id=data.position_id,
        )

        if teams:
            new_patient.teams = teams

        if data.assigned_location_ids:
            for loc_id in data.assigned_location_ids:
                if loc_id not in accessible_location_ids:
                    raise GraphQLError(
                        "Insufficient permission. Please contact an administrator if you believe this is an error.",
                        extensions={"code": "FORBIDDEN"},
                    )
            locations = await location_service.get_locations_by_ids(
                data.assigned_location_ids
            )
            new_patient.assigned_locations = locations
        elif data.assigned_location_id:
            if data.assigned_location_id not in accessible_location_ids:
                raise GraphQLError(
                    "Insufficient permission. Please contact an administrator if you believe this is an error.",
                    extensions={"code": "FORBIDDEN"},
                )
            location = await location_service.get_location_by_id(
                data.assigned_location_id
            )
            new_patient.assigned_locations = [location] if location else []

        if data.properties is not None:
            property_service = PatientMutation._get_property_service(db)
            await property_service.process_properties(
                new_patient, data.properties, "patient"
            )

        repo = BaseMutationResolver.get_repository(db, models.Patient)
        await repo.create(new_patient)
        await db.refresh(new_patient, ["assigned_locations", "teams"])
        await BaseMutationResolver.create_and_notify(
            info, new_patient, models.Patient, "patient"
        )
        return new_patient

    @strawberry.mutation
    @audit_log("update_patient")
    async def update_patient(
        self,
        info: Info,
        id: strawberry.ID,
        data: UpdatePatientInput,
    ) -> PatientType:
        db = info.context.db
        result = await db.execute(
            select(models.Patient)
            .where(models.Patient.id == id)
            .options(
                selectinload(models.Patient.assigned_locations),
                selectinload(models.Patient.teams),
            ),
        )
        patient = result.scalars().first()
        if not patient:
            raise Exception("Patient not found")

        auth_service = AuthorizationService(db)
        if not await auth_service.can_access_patient(info.context.user, patient, info.context):
            raise GraphQLError(
                "Forbidden: You do not have access to this patient",
                extensions={"code": "FORBIDDEN"},
            )

        if data.checksum:
            validate_checksum(patient, data.checksum, "Patient")

        if data.firstname is not None:
            patient.firstname = data.firstname
        if data.lastname is not None:
            patient.lastname = data.lastname
        if data.birthdate is not None:
            patient.birthdate = data.birthdate
        if data.sex is not None:
            patient.sex = data.sex.value

        location_service = PatientMutation._get_location_service(db)
        accessible_location_ids = await auth_service.get_user_accessible_location_ids(
            info.context.user
        )

        if data.clinic_id is not None:
            if data.clinic_id not in accessible_location_ids:
                raise GraphQLError(
                    "Insufficient permission. Please contact an administrator if you believe this is an error.",
                    extensions={"code": "FORBIDDEN"},
                )
            await location_service.validate_and_get_clinic(data.clinic_id)
            patient.clinic_id = data.clinic_id

        if data.position_id is not strawberry.UNSET:
            if data.position_id is None:
                patient.position_id = None
            else:
                if data.position_id not in accessible_location_ids:
                    raise GraphQLError(
                        "Insufficient permission. Please contact an administrator if you believe this is an error.",
                        extensions={"code": "FORBIDDEN"},
                    )
                await location_service.validate_and_get_position(
                    data.position_id
                )
                patient.position_id = data.position_id

        if data.team_ids is not strawberry.UNSET:
            if data.team_ids is None or len(data.team_ids) == 0:
                patient.teams = []
            else:
                for team_id in data.team_ids:
                    if team_id not in accessible_location_ids:
                        raise GraphQLError(
                            "Insufficient permission. Please contact an administrator if you believe this is an error.",
                            extensions={"code": "FORBIDDEN"},
                        )
                patient.teams = await location_service.validate_and_get_teams(
                    data.team_ids
                )

        if data.assigned_location_ids is not None:
            for loc_id in data.assigned_location_ids:
                if loc_id not in accessible_location_ids:
                    raise GraphQLError(
                        "Insufficient permission. Please contact an administrator if you believe this is an error.",
                        extensions={"code": "FORBIDDEN"},
                    )
            locations = await location_service.get_locations_by_ids(
                data.assigned_location_ids
            )
            patient.assigned_locations = locations
        elif data.assigned_location_id is not None:
            if data.assigned_location_id not in accessible_location_ids:
                raise GraphQLError(
                    "Insufficient permission. Please contact an administrator if you believe this is an error.",
                    extensions={"code": "FORBIDDEN"},
                )
            location = await location_service.get_location_by_id(
                data.assigned_location_id
            )
            patient.assigned_locations = [location] if location else []

        if data.properties is not None:
            property_service = PatientMutation._get_property_service(db)
            await property_service.process_properties(
                patient, data.properties, "patient"
            )

        await BaseMutationResolver.update_and_notify(
            info, patient, models.Patient, "patient"
        )
        await db.refresh(patient, ["assigned_locations", "teams"])
        return patient

    @strawberry.mutation
    @audit_log("delete_patient")
    async def delete_patient(self, info: Info, id: strawberry.ID) -> bool:
        db = info.context.db
        result = await db.execute(
            select(models.Patient)
            .where(models.Patient.id == id)
            .where(models.Patient.deleted.is_(False))
            .options(
                selectinload(models.Patient.assigned_locations),
                selectinload(models.Patient.teams),
            ),
        )
        patient = result.scalars().first()
        if not patient:
            return False

        auth_service = AuthorizationService(db)
        if not await auth_service.can_access_patient(info.context.user, patient, info.context):
            raise GraphQLError(
                "Forbidden: You do not have access to this patient",
                extensions={"code": "FORBIDDEN"},
            )

        patient.deleted = True
        await BaseMutationResolver.update_and_notify(
            info, patient, models.Patient, "patient"
        )
        return True

    @staticmethod
    async def _update_patient_state(
        info: Info,
        id: strawberry.ID,
        state: PatientState,
    ) -> PatientType:
        from api.services.notifications import notify_entity_update
        db = info.context.db
        result = await db.execute(
            select(models.Patient)
            .where(models.Patient.id == id)
            .options(
                selectinload(models.Patient.assigned_locations),
                selectinload(models.Patient.teams),
            ),
        )
        patient = result.scalars().first()
        if not patient:
            raise Exception("Patient not found")

        auth_service = AuthorizationService(db)
        if not await auth_service.can_access_patient(info.context.user, patient, info.context):
            raise GraphQLError(
                "Forbidden: You do not have access to this patient",
                extensions={"code": "FORBIDDEN"},
            )

        patient.state = state.value
        await BaseMutationResolver.update_and_notify(
            info, patient, models.Patient, "patient"
        )
        await db.refresh(patient, ["assigned_locations"])
        await notify_entity_update("patient_state_changed", patient.id)
        return patient

    @strawberry.mutation
    @audit_log("admit_patient")
    async def admit_patient(
        self, info: Info, id: strawberry.ID
    ) -> PatientType:
        return await PatientMutation._update_patient_state(
            info, id, PatientState.ADMITTED
        )

    @strawberry.mutation
    @audit_log("discharge_patient")
    async def discharge_patient(
        self, info: Info, id: strawberry.ID
    ) -> PatientType:
        return await PatientMutation._update_patient_state(
            info, id, PatientState.DISCHARGED
        )

    @strawberry.mutation
    @audit_log("mark_patient_dead")
    async def mark_patient_dead(
        self, info: Info, id: strawberry.ID
    ) -> PatientType:
        return await PatientMutation._update_patient_state(info, id, PatientState.DEAD)

    @strawberry.mutation
    @audit_log("wait_patient")
    async def wait_patient(self, info: Info, id: strawberry.ID) -> PatientType:
        return await PatientMutation._update_patient_state(info, id, PatientState.WAIT)


@strawberry.type
class PatientSubscription(BaseSubscriptionResolver):
    @strawberry.subscription
    async def patient_created(
        self, info: Info
    ) -> AsyncGenerator[strawberry.ID, None]:
        async for patient_id in BaseSubscriptionResolver.entity_created(info, "patient"):
            yield patient_id

    @strawberry.subscription
    async def patient_updated(
        self,
        info: Info,
        patient_id: strawberry.ID | None = None,
    ) -> AsyncGenerator[strawberry.ID, None]:
        async for updated_id in BaseSubscriptionResolver.entity_updated(info, "patient", patient_id):
            yield updated_id

    @strawberry.subscription
    async def patient_state_changed(
        self,
        info: Info,
        patient_id: strawberry.ID | None = None,
    ) -> AsyncGenerator[strawberry.ID, None]:
        from api.services.subscription import create_redis_subscription

        async for updated_id in create_redis_subscription(
            "patient_state_changed", patient_id
        ):
            yield updated_id

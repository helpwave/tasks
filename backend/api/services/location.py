from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import models
from .validation import LocationValidator


class LocationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.validator = LocationValidator()

    async def get_location_by_id(
        self, location_id: str
    ) -> models.LocationNode | None:
        result = await self.db.execute(
            select(models.LocationNode).where(
                models.LocationNode.id == location_id
            ),
        )
        return result.scalars().first()

    async def get_location_by_id_or_raise(
        self,
        location_id: str,
        error_message: str | None = None,
    ) -> models.LocationNode:
        location = await self.get_location_by_id(location_id)
        if not location:
            raise Exception(
                error_message or f"Location with id {location_id} not found"
            )
        return location

    async def get_locations_by_ids(
        self,
        location_ids: list[str],
    ) -> list[models.LocationNode]:
        if not location_ids:
            return []
        result = await self.db.execute(
            select(models.LocationNode).where(
                models.LocationNode.id.in_(location_ids)
            ),
        )
        return list(result.scalars().all())

    async def validate_and_get_clinic(
        self,
        clinic_id: str,
    ) -> models.LocationNode:
        clinic = await self.get_location_by_id_or_raise(
            clinic_id,
            f"Clinic location with id {clinic_id} not found",
        )
        self.validator.validate_kind(clinic, "CLINIC", "clinic_id")
        return clinic

    async def validate_and_get_position(
        self,
        position_id: str | None,
    ) -> models.LocationNode | None:
        if not position_id:
            return None
        position = await self.get_location_by_id_or_raise(
            position_id,
            f"Position location with id {position_id} not found",
        )
        self.validator.validate_position_kind(position, "position_id")
        return position

    async def validate_and_get_teams(
        self,
        team_ids: list[str],
    ) -> list[models.LocationNode]:
        if not team_ids:
            return []
        teams = await self.get_locations_by_ids(team_ids)
        if len(teams) != len(team_ids):
            found_ids = {t.id for t in teams}
            missing_ids = set(team_ids) - found_ids
            raise Exception(f"Team locations with ids {missing_ids} not found")
        for team in teams:
            self.validator.validate_team_kind(team, "team_ids")
        return teams

from database import models


class LocationValidator:
    @staticmethod
    def validate_kind(location: models.LocationNode, expected_kind: str, field_name: str) -> None:
        if location.kind.upper() != expected_kind.upper():
            raise Exception(
                f"{field_name} must be a location of kind {expected_kind}, "
                f"but got {location.kind}"
            )

    @staticmethod
    def validate_position_kind(location: models.LocationNode, field_name: str) -> None:
        allowed_kinds = {"HOSPITAL", "PRACTICE", "CLINIC", "WARD", "BED", "ROOM"}
        if location.kind.upper() not in allowed_kinds:
            raise Exception(
                f"{field_name} must be a location of kind HOSPITAL, PRACTICE, CLINIC, "
                f"WARD, BED, or ROOM, but got {location.kind}"
            )

    @staticmethod
    def validate_team_kind(location: models.LocationNode, field_name: str) -> None:
        allowed_kinds = {"CLINIC", "TEAM", "PRACTICE", "HOSPITAL"}
        if location.kind.upper() not in allowed_kinds:
            raise Exception(
                f"{field_name} must be a location of kind CLINIC, TEAM, PRACTICE, "
                f"or HOSPITAL, but got {location.kind}"
            )



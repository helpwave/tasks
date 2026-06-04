import pytest

from api.services.validation import LocationValidator


class _Location:
    def __init__(self, kind: str) -> None:
        self.kind = kind


def test_validate_kind_accepts_matching_kind_case_insensitively() -> None:
    LocationValidator.validate_kind(_Location("ward"), "WARD", "position")


def test_validate_kind_rejects_mismatching_kind() -> None:
    with pytest.raises(Exception, match="must be a location of kind WARD"):
        LocationValidator.validate_kind(_Location("ROOM"), "WARD", "position")


@pytest.mark.parametrize(
    "kind", ["HOSPITAL", "PRACTICE", "CLINIC", "WARD", "BED", "ROOM"]
)
def test_validate_position_kind_accepts_allowed_kinds(kind: str) -> None:
    LocationValidator.validate_position_kind(_Location(kind.lower()), "position")


def test_validate_position_kind_rejects_team() -> None:
    with pytest.raises(Exception, match="must be a location of kind"):
        LocationValidator.validate_position_kind(_Location("TEAM"), "position")


@pytest.mark.parametrize("kind", ["CLINIC", "TEAM", "PRACTICE", "HOSPITAL"])
def test_validate_team_kind_accepts_allowed_kinds(kind: str) -> None:
    LocationValidator.validate_team_kind(_Location(kind), "team")


def test_validate_team_kind_rejects_bed() -> None:
    with pytest.raises(Exception, match="must be a location of kind"):
        LocationValidator.validate_team_kind(_Location("BED"), "team")

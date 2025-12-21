import pytest
from api.services.location import LocationService
from database.models.location import LocationNode


@pytest.mark.asyncio
async def test_get_location_by_id(db_session, sample_location):
    service = LocationService(db_session)
    result = await service.get_location_by_id(sample_location.id)
    assert result is not None
    assert result.id == sample_location.id


@pytest.mark.asyncio
async def test_get_location_by_id_not_found(db_session):
    service = LocationService(db_session)
    result = await service.get_location_by_id("non-existent")
    assert result is None


@pytest.mark.asyncio
async def test_get_location_by_id_or_raise(db_session, sample_location):
    service = LocationService(db_session)
    result = await service.get_location_by_id_or_raise(sample_location.id)
    assert result.id == sample_location.id


@pytest.mark.asyncio
async def test_get_location_by_id_or_raise_not_found(db_session):
    service = LocationService(db_session)
    with pytest.raises(Exception, match="not found"):
        await service.get_location_by_id_or_raise("non-existent")


@pytest.mark.asyncio
async def test_get_locations_by_ids(db_session, sample_location):
    service = LocationService(db_session)
    location2 = LocationNode(id="location-2", title="Location 2", kind="WARD")
    db_session.add(location2)
    await db_session.commit()

    results = await service.get_locations_by_ids(
        [sample_location.id, "location-2"]
    )
    assert len(results) == 2


@pytest.mark.asyncio
async def test_validate_and_get_clinic(db_session, sample_location):
    service = LocationService(db_session)
    result = await service.validate_and_get_clinic(sample_location.id)
    assert result.id == sample_location.id
    assert result.kind == "CLINIC"


@pytest.mark.asyncio
async def test_validate_and_get_clinic_wrong_kind(db_session):
    service = LocationService(db_session)
    ward = LocationNode(id="ward-1", title="Ward", kind="WARD")
    db_session.add(ward)
    await db_session.commit()

    with pytest.raises(Exception, match="must be a location of kind CLINIC"):
        await service.validate_and_get_clinic("ward-1")


@pytest.mark.asyncio
async def test_validate_and_get_position(db_session):
    service = LocationService(db_session)
    ward = LocationNode(id="ward-1", title="Ward", kind="WARD")
    db_session.add(ward)
    await db_session.commit()

    result = await service.validate_and_get_position("ward-1")
    assert result is not None
    assert result.kind == "WARD"


@pytest.mark.asyncio
async def test_validate_and_get_teams(db_session):
    service = LocationService(db_session)
    team1 = LocationNode(id="team-1", title="Team 1", kind="TEAM")
    team2 = LocationNode(id="team-2", title="Team 2", kind="TEAM")
    db_session.add(team1)
    db_session.add(team2)
    await db_session.commit()

    results = await service.validate_and_get_teams(["team-1", "team-2"])
    assert len(results) == 2


@pytest.mark.asyncio
async def test_validate_and_get_teams_missing(db_session):
    service = LocationService(db_session)
    team1 = LocationNode(id="team-1", title="Team 1", kind="TEAM")
    db_session.add(team1)
    await db_session.commit()

    with pytest.raises(Exception, match="not found"):
        await service.validate_and_get_teams(["team-1", "non-existent"])

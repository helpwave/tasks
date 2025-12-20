import pytest
from api.services.checksum import validate_checksum


@pytest.mark.asyncio
async def test_validate_checksum_valid(db_session, sample_task):
    from api.types.base import calculate_checksum_for_instance

    checksum = calculate_checksum_for_instance(sample_task)
    validate_checksum(sample_task, checksum, "Task")


@pytest.mark.asyncio
async def test_validate_checksum_invalid(db_session, sample_task):
    with pytest.raises(Exception, match="CONFLICT"):
        validate_checksum(sample_task, "invalid-checksum", "Task")


@pytest.mark.asyncio
async def test_validate_checksum_none(db_session, sample_task):
    validate_checksum(sample_task, None, "Task")



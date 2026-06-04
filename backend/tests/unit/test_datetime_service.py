from datetime import datetime, timedelta, timezone

from api.services.datetime import normalize_datetime_to_utc


def test_none_returns_none() -> None:
    assert normalize_datetime_to_utc(None) is None


def test_naive_datetime_is_returned_unchanged() -> None:
    naive = datetime(2026, 1, 1, 12, 0, 0)
    result = normalize_datetime_to_utc(naive)
    assert result == naive
    assert result.tzinfo is None


def test_utc_aware_datetime_is_stripped_to_naive() -> None:
    aware = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    result = normalize_datetime_to_utc(aware)
    assert result == datetime(2026, 1, 1, 12, 0, 0)
    assert result.tzinfo is None


def test_offset_datetime_is_converted_to_utc() -> None:
    plus_two = timezone(timedelta(hours=2))
    aware = datetime(2026, 1, 1, 12, 0, 0, tzinfo=plus_two)
    result = normalize_datetime_to_utc(aware)
    assert result == datetime(2026, 1, 1, 10, 0, 0)
    assert result.tzinfo is None

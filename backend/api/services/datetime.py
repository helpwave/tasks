from datetime import timezone


def normalize_datetime_to_utc(dt) -> None | object:
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt

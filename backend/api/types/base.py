from datetime import date, datetime
from typing import Any

import strawberry
from api.audit import AuditLogger


def calculate_checksum_for_instance(instance: Any) -> str:
    try:
        exclude = getattr(instance, "_checksum_exclude", set())
        if not isinstance(exclude, set):
            exclude = set()
    except Exception:
        exclude = set()
    data = {}

    if hasattr(instance, "__annotations__"):
        for field_name in instance.__annotations__.keys():
            if field_name.startswith("_") or field_name in exclude:
                continue
            try:
                try:
                    value = object.__getattribute__(instance, field_name)
                except AttributeError:
                    continue

                if _is_safe_to_serialize(value):
                    data[field_name] = _serialize_value(value)
            except Exception:
                pass

    return AuditLogger.calculate_checksum(data)


def _is_safe_to_serialize(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, (str, int, float, bool, date, datetime)):
        return True
    if hasattr(value, "value") and not hasattr(value, "__iter__"):
        return True
    if hasattr(value, "__class__"):
        class_name = value.__class__.__name__
        if any(x in class_name for x in ["InstrumentedList", "AppenderQuery", "Query", "Session"]):
            return False
    if hasattr(value, "__iter__") and not isinstance(value, (str, bytes)):
        return False
    return True


def _serialize_value(value: Any) -> Any:
    if value is None:
        return None
    elif isinstance(value, (str, int, float, bool)):
        return value
    elif isinstance(value, (date, datetime)):
        return str(value)
    elif hasattr(value, "value"):
        return value.value
    else:
        return str(value)


class ChecksumMixin:
    @property
    def _checksum_exclude(self) -> set[str]:
        return set()

    def _serialize_value(self, value: Any) -> Any:
        if value is None:
            return None
        elif isinstance(value, (str, int, float, bool)):
            return value
        elif isinstance(value, (date, datetime)):
            return str(value)
        elif hasattr(value, "value"):
            return value.value
        else:
            return str(value)

    def _get_checksum_data(self) -> dict[str, Any]:
        exclude = self._checksum_exclude
        data = {}

        if hasattr(self, "__annotations__"):
            for field_name in self.__annotations__.keys():
                if field_name.startswith("_") or field_name in exclude:
                    continue
                try:
                    value = getattr(self, field_name, None)
                    data[field_name] = self._serialize_value(value)
                except AttributeError:
                    pass

        if hasattr(self, "__dict__"):
            for field_name, value in self.__dict__.items():
                if (
                    field_name.startswith("_")
                    or field_name in exclude
                    or field_name in data
                ):
                    continue
                try:
                    data[field_name] = self._serialize_value(value)
                except Exception:
                    pass

        return data

    @strawberry.field
    def checksum(self) -> str:
        data = self._get_checksum_data()
        return AuditLogger.calculate_checksum(data)

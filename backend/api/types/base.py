from datetime import date, datetime
from typing import Any

import strawberry
from api.audit import AuditLogger


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


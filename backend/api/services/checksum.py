from typing import Any

from api.types.base import calculate_checksum_for_instance


def validate_checksum(
    entity: Any,
    provided_checksum: str,
    entity_name: str = "Entity",
) -> None:
    if not provided_checksum:
        return

    current_checksum = calculate_checksum_for_instance(entity)

    if provided_checksum != current_checksum:
        raise Exception(
            f"CONFLICT: {entity_name} data has been modified. "
            f"Expected checksum: {current_checksum}, Got: {provided_checksum}"
        )

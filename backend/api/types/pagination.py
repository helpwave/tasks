from typing import TYPE_CHECKING, Annotated

import strawberry

if TYPE_CHECKING:
    from api.types.patient import PatientType
    from api.types.task import TaskType


@strawberry.type
class PaginatedPatientResult:
    items: list[Annotated["PatientType", strawberry.lazy("api.types.patient")]]
    total_count: int


@strawberry.type
class PaginatedTaskResult:
    items: list[Annotated["TaskType", strawberry.lazy("api.types.task")]]
    total_count: int

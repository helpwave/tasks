from typing import Any

from api.query.adapters import patient as patient_adapters
from api.query.adapters import task as task_adapters
from api.query.adapters import user as user_adapters
from database import models

EntityHandler = dict[str, Any]

TASK = "Task"
PATIENT = "Patient"
USER = "User"


ENTITY_REGISTRY: dict[str, EntityHandler] = {
    TASK: {
        "root_model": models.Task,
        "apply_filter": task_adapters.apply_task_filter_clause,
        "apply_sorts": task_adapters.apply_task_sorts,
        "apply_search": task_adapters.apply_task_search,
    },
    PATIENT: {
        "root_model": models.Patient,
        "apply_filter": patient_adapters.apply_patient_filter_clause,
        "apply_sorts": patient_adapters.apply_patient_sorts,
        "apply_search": patient_adapters.apply_patient_search,
    },
    USER: {
        "root_model": models.User,
        "apply_filter": user_adapters.apply_user_filter_clause,
        "apply_sorts": user_adapters.apply_user_sorts,
        "apply_search": user_adapters.apply_user_search,
    },
}


def get_entity_handler(entity: str) -> EntityHandler | None:
    return ENTITY_REGISTRY.get(entity)

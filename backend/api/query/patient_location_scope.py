from typing import Any

from sqlalchemy import Select, select
from sqlalchemy.orm import aliased

from database import models


def build_location_descendants_cte(
    seed_ids: list[str],
    *,
    cte_name: str = "location_descendants",
) -> Any:
    if not seed_ids:
        raise ValueError("seed_ids must not be empty")
    if len(seed_ids) == 1:
        anchor = select(models.LocationNode.id).where(
            models.LocationNode.id == seed_ids[0]
        )
    else:
        anchor = select(models.LocationNode.id).where(
            models.LocationNode.id.in_(seed_ids)
        )
    filter_cte = anchor.cte(name=cte_name, recursive=True)
    children = select(models.LocationNode.id).join(
        filter_cte,
        models.LocationNode.parent_id == filter_cte.c.id,
    )
    return filter_cte.union_all(children)


def apply_patient_subtree_filter_from_cte(
    query: Select[Any],
    filter_cte: Any,
) -> Select[Any]:
    patient_locations_filter = aliased(models.patient_locations)
    patient_teams_filter = aliased(models.patient_teams)

    return (
        query.outerjoin(
            patient_locations_filter,
            models.Patient.id == patient_locations_filter.c.patient_id,
        )
        .outerjoin(
            patient_teams_filter,
            models.Patient.id == patient_teams_filter.c.patient_id,
        )
        .where(
            (models.Patient.clinic_id.in_(select(filter_cte.c.id)))
            | (
                models.Patient.position_id.isnot(None)
                & models.Patient.position_id.in_(select(filter_cte.c.id))
            )
            | (
                models.Patient.assigned_location_id.isnot(None)
                & models.Patient.assigned_location_id.in_(
                    select(filter_cte.c.id)
                )
            )
            | (
                patient_locations_filter.c.location_id.in_(
                    select(filter_cte.c.id)
                )
            )
            | (
                patient_teams_filter.c.location_id.in_(
                    select(filter_cte.c.id)
                )
            )
        )
    )

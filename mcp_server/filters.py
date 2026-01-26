from __future__ import annotations

from datetime import date, datetime
from typing import Any


def normalize_text(value: str | None) -> str:
    return (value or "").strip().lower()


def parse_date(value: str | None) -> date | None:
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%d.%m.%Y"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


def patient_full_name(patient: dict[str, Any]) -> str:
    firstname = patient.get("firstname") or ""
    lastname = patient.get("lastname") or ""
    return normalize_text(f"{firstname} {lastname}")


def matches_name(patient: dict[str, Any], query: str) -> bool:
    query_value = normalize_text(query)
    if not query_value:
        return True
    full_name = patient_full_name(patient)
    reverse_name = normalize_text(
        f"{patient.get('lastname') or ''} {patient.get('firstname') or ''}"
    )
    return query_value in full_name or query_value in reverse_name


def matches_properties(
    properties: list[dict[str, Any]] | None,
    filters: list[dict[str, Any]] | None,
) -> bool:
    if not filters:
        return True
    if not properties:
        return False
    for prop_filter in filters:
        name = normalize_text(str(prop_filter.get("name") or ""))
        value = normalize_text(str(prop_filter.get("value") or ""))
        if not name:
            return False
        matched = False
        for prop in properties:
            definition = prop.get("definition") or {}
            prop_name = normalize_text(str(definition.get("name") or ""))
            if prop_name != name:
                continue
            values = [
                prop.get("textValue"),
                prop.get("numberValue"),
                prop.get("booleanValue"),
                prop.get("dateValue"),
                prop.get("dateTimeValue"),
                prop.get("selectValue"),
                prop.get("multiSelectValues"),
            ]
            for raw in values:
                if raw is None:
                    continue
                if isinstance(raw, list):
                    combined = normalize_text(",".join(str(v) for v in raw))
                    if value in combined:
                        matched = True
                        break
                else:
                    if value in normalize_text(str(raw)):
                        matched = True
                        break
            if matched:
                break
        if not matched:
            return False
    return True


def filter_patients(
    patients: list[dict[str, Any]],
    name: str | None,
    birthdate: str | None,
    sex: str | None,
    state: str | None,
    description: str | None,
    property_filters: list[dict[str, Any]] | None,
) -> list[dict[str, Any]]:
    birthdate_value = parse_date(birthdate)
    sex_value = normalize_text(sex)
    state_value = normalize_text(state)
    description_value = normalize_text(description)
    results: list[dict[str, Any]] = []
    for patient in patients:
        if name and not matches_name(patient, name):
            continue
        if birthdate_value:
            patient_birthdate = parse_date(patient.get("birthdate"))
            if not patient_birthdate or patient_birthdate != birthdate_value:
                continue
        if sex_value and normalize_text(patient.get("sex")) != sex_value:
            continue
        if state_value and normalize_text(patient.get("state")) != state_value:
            continue
        if description_value and description_value not in normalize_text(
            patient.get("description")
        ):
            continue
        if not matches_properties(patient.get("properties"), property_filters):
            continue
        results.append(patient)
    return results


def filter_tasks(
    tasks: list[dict[str, Any]],
    patient_name: str | None,
    patient_id: str | None,
    title_contains: str | None,
    description_contains: str | None,
    done: bool | None,
    priority: str | None,
    property_filters: list[dict[str, Any]] | None,
) -> list[dict[str, Any]]:
    title_value = normalize_text(title_contains)
    description_value = normalize_text(description_contains)
    priority_value = normalize_text(priority)
    results: list[dict[str, Any]] = []
    for task in tasks:
        patient = task.get("patient") or {}
        if patient_id and patient.get("id") != patient_id:
            continue
        if patient_name and not matches_name(patient, patient_name):
            continue
        if title_value and title_value not in normalize_text(task.get("title")):
            continue
        if description_value and description_value not in normalize_text(
            task.get("description")
        ):
            continue
        if done is not None and task.get("done") is not done:
            continue
        if priority_value and normalize_text(task.get("priority")) != priority_value:
            continue
        if not matches_properties(task.get("properties"), property_filters):
            continue
        results.append(task)
    return results

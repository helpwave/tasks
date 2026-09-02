import logging
import re
from datetime import datetime
from typing import Any

import strawberry
from api.audit import AuditLogger
from api.context import Info
from api.errors import raise_forbidden, raise_unauthenticated
from api.services.authorization import AuthorizationService
from api.types.audit import AuditLogType
from config import INFLUXDB_BUCKET, INFLUXDB_ORG, LOGGER
from database import models
from graphql import GraphQLError
from sqlalchemy import select
from sqlalchemy.orm import selectinload

logger = logging.getLogger(LOGGER)

# Audit case ids are entity ids (uuids). Constraining the charset makes it
# impossible for the value to break out of the Flux string literal below.
_CASE_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
_MAX_AUDIT_LIMIT = 1000


async def _authorize_case_access(
    info: Info,
    case_id: str,
) -> None:
    user = info.context.user
    if not user:
        raise_unauthenticated()

    auth_service = AuthorizationService(info.context.db)
    if await auth_service.can_access_patient_id(user, case_id, info.context):
        return

    result = await info.context.db.execute(
        select(models.Task)
        .where(models.Task.id == case_id)
        .options(
            selectinload(models.Task.patient).selectinload(
                models.Patient.assigned_locations
            ),
            selectinload(models.Task.patient).selectinload(
                models.Patient.teams
            ),
        )
    )
    task = result.scalars().first()
    if task and await auth_service.can_access_task(user, task, info.context):
        return

    raise_forbidden()


@strawberry.type
class AuditQuery:
    @strawberry.field
    async def audit_logs(
        self,
        info: Info,
        case_id: strawberry.ID,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[AuditLogType]:
        case_id_str = str(case_id)
        if not _CASE_ID_PATTERN.match(case_id_str):
            raise GraphQLError(
                "Invalid case id.",
                extensions={"code": "BAD_REQUEST"},
            )

        # Deny-by-default: only expose a case's audit trail to a caller who can
        # access the underlying patient or task.
        await _authorize_case_access(info, case_id_str)

        client = AuditLogger._get_client()
        if not client:
            logger.warning(
                "InfluxDB client not available for audit log query"
            )
            return []

        limit_clause = ""
        if limit is not None:
            safe_limit = max(0, min(int(limit), _MAX_AUDIT_LIMIT))
            safe_offset = max(0, int(offset)) if offset is not None else 0
            limit_clause = f"|> limit(n: {safe_limit}, offset: {safe_offset})"

        try:
            query_api = client.query_api()

            query = f'''
                from(bucket: "{INFLUXDB_BUCKET}")
                |> range(start: 0)
                |> filter(fn: (r) => r["_measurement"] == "activity")
                |> filter(fn: (r) => r["case_id"] == "{case_id_str}")
                |> sort(columns: ["_time"], desc: true)
                {limit_clause}
            '''

            result = query_api.query(org=INFLUXDB_ORG, query=query)

            audit_logs: list[AuditLogType] = []
            seen_combinations: set[tuple[str, datetime]] = set()

            for table in result:
                record_data: dict[str, Any] = {}
                timestamp: datetime | None = None

                for record in table.records:
                    if timestamp is None:
                        timestamp = record.get_time()

                    field = record.get_field()
                    value = record.get_value()

                    if field == "context":
                        record_data["context"] = value
                    elif field == "count":
                        record_data["count"] = value

                    case_id_value = record.values.get("case_id", "")
                    activity = record.values.get("activity", "")
                    user_id = record.values.get("user_id")

                if timestamp and case_id_value and activity:
                    key = (case_id_value, activity, timestamp)
                    if key not in seen_combinations:
                        seen_combinations.add(key)
                        audit_logs.append(
                            AuditLogType(
                                case_id=case_id_value,
                                activity=activity,
                                user_id=user_id,
                                timestamp=timestamp,
                                context=record_data.get("context"),
                            )
                        )

            return sorted(audit_logs, key=lambda x: x.timestamp, reverse=True)
        except Exception as e:
            logger.error(f"Error querying audit logs: {e}")
            return []

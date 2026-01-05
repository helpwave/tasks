import logging
from datetime import datetime
from typing import Any

import strawberry
from api.audit import AuditLogger
from api.context import Info
from api.types.audit import AuditLogType
from config import INFLUXDB_BUCKET, INFLUXDB_ORG, LOGGER

logger = logging.getLogger(LOGGER)


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
        client = AuditLogger._get_client()
        if not client:
            logger.warning(
                "InfluxDB client not available for audit log query"
            )
            return []

        try:
            query_api = client.query_api()

            limit_clause = f"LIMIT {limit}" if limit else ""
            offset_clause = f"OFFSET {offset}" if offset else ""

            query = f'''
                from(bucket: "{INFLUXDB_BUCKET}")
                |> range(start: 0)
                |> filter(fn: (r) => r["_measurement"] == "activity")
                |> filter(fn: (r) => r["case_id"] == "{case_id}")
                |> sort(columns: ["_time"], desc: true)
                {offset_clause}
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

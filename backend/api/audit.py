import hashlib
import json
import logging
from datetime import datetime, timezone
from functools import wraps
from typing import Any, Callable

from config import INFLUXDB_BUCKET, INFLUXDB_ORG, INFLUXDB_TOKEN, INFLUXDB_URL, LOGGER
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS

logger = logging.getLogger(LOGGER)


class AuditLogger:
    _client: InfluxDBClient | None = None
    _write_api = None

    @classmethod
    def _get_client(cls) -> InfluxDBClient | None:
        if not INFLUXDB_TOKEN:
            logger.warning("InfluxDB token not configured, skipping audit logging")
            return None
        if cls._client is None:
            try:
                logger.info(f"Connecting to InfluxDB at {INFLUXDB_URL}")
                cls._client = InfluxDBClient(
                    url=INFLUXDB_URL,
                    token=INFLUXDB_TOKEN,
                    org=INFLUXDB_ORG,
                )
                cls._write_api = cls._client.write_api(write_options=SYNCHRONOUS)
                logger.info(f"Successfully connected to InfluxDB (org: {INFLUXDB_ORG}, bucket: {INFLUXDB_BUCKET})")
            except Exception as e:
                logger.error(f"Failed to connect to InfluxDB: {e}")
                return None
        return cls._client

    @classmethod
    def log_activity(
        cls,
        case_id: str,
        activity_name: str,
        user_id: str | None = None,
        user_name: str | None = None,
        context: dict[str, Any] | None = None,
    ) -> None:
        client = cls._get_client()
        if not client or not cls._write_api:
            logger.debug(f"Skipping InfluxDB log for activity {activity_name} (case_id: {case_id}) - client not available")
            return

        try:
            point = (
                Point("activity")
                .tag("case_id", case_id)
                .tag("activity", activity_name)
                .field("timestamp", datetime.now(timezone.utc).timestamp())
            )

            if user_id:
                point = point.tag("user_id", user_id)
            if user_name:
                point = point.tag("user_name", user_name)
            if context:
                point = point.field("context", json.dumps(context))

            logger.info(f"Writing to InfluxDB: activity={activity_name}, case_id={case_id}, user_id={user_id}, bucket={INFLUXDB_BUCKET}")
            cls._write_api.write(bucket=INFLUXDB_BUCKET, record=point)
            logger.debug(f"Successfully wrote to InfluxDB: activity={activity_name}, case_id={case_id}")
        except Exception as e:
            logger.error(f"Failed to write to InfluxDB: activity={activity_name}, case_id={case_id}, error={e}")

    @classmethod
    def calculate_checksum(cls, data: dict[str, Any] | Any) -> str:
        if isinstance(data, dict):
            sorted_data = json.dumps(data, sort_keys=True, default=str)
        else:
            sorted_data = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(sorted_data.encode()).hexdigest()


def audit_log(activity_name: str | None = None):
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            info = None
            for arg in args:
                if hasattr(arg, "context"):
                    info = arg
                    break

            if not info or not hasattr(info, "context"):
                return await func(*args, **kwargs)

            context = info.context
            user = context.user
            user_id = user.id if user else None
            user_name = user.username if user else None

            case_id = None
            entity_id = None

            if "id" in kwargs:
                entity_id = str(kwargs["id"])
            elif len(args) > 1 and isinstance(args[1], str):
                entity_id = args[1]

            if entity_id:
                case_id = entity_id

            activity = activity_name or func.__name__

            audit_context = {}
            if "data" in kwargs:
                audit_context["data"] = str(kwargs["data"])

            result = await func(*args, **kwargs)

            if hasattr(result, "id"):
                case_id = str(result.id)
            elif isinstance(result, dict) and "id" in result:
                case_id = str(result["id"])

            if case_id:
                AuditLogger.log_activity(
                    case_id=case_id,
                    activity_name=activity,
                    user_id=user_id,
                    user_name=user_name,
                    context=audit_context if audit_context else None,
                )

            return result

        return wrapper

    return decorator


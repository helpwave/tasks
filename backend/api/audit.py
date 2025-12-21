import hashlib
import inspect
import json
import logging
from datetime import date, datetime, timezone
from functools import wraps
from typing import Any, Callable

import strawberry
from config import (
    INFLUXDB_BUCKET,
    INFLUXDB_ORG,
    INFLUXDB_TOKEN,
    INFLUXDB_URL,
    LOGGER,
)
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS

logger = logging.getLogger(LOGGER)


class AuditLogger:
    _client: InfluxDBClient | None = None
    _write_api = None

    @classmethod
    def _get_client(cls) -> InfluxDBClient | None:
        if not INFLUXDB_TOKEN:
            logger.warning(
                "InfluxDB token not configured, skipping audit logging"
            )
            return None
        if cls._client is None:
            try:
                logger.info(f"Connecting to InfluxDB at {INFLUXDB_URL}")
                cls._client = InfluxDBClient(
                    url=INFLUXDB_URL,
                    token=INFLUXDB_TOKEN,
                    org=INFLUXDB_ORG,
                )
                cls._write_api = cls._client.write_api(
                    write_options=SYNCHRONOUS
                )
                logger.info(
                    f"Successfully connected to InfluxDB (org: {INFLUXDB_ORG}, bucket: {INFLUXDB_BUCKET})"
                )
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
        context: dict[str, Any] | None = None,
    ) -> None:
        client = cls._get_client()
        if not client or not cls._write_api:
            logger.debug(
                f"Skipping InfluxDB log for activity {activity_name} (case_id: {case_id}) - client not available"
            )
            return

        try:
            now = datetime.now(timezone.utc)
            point = (
                Point("activity")
                .tag("case_id", case_id)
                .tag("activity", activity_name)
                .field("count", 1)
                .time(now)
            )

            if user_id:
                point = point.tag("user_id", user_id)
            if context:
                point = point.field("context", json.dumps(context))

            logger.info(
                f"Writing to InfluxDB: activity={activity_name}, case_id={case_id}, user_id={user_id}, bucket={INFLUXDB_BUCKET}"
            )
            cls._write_api.write(bucket=INFLUXDB_BUCKET, record=point)
            logger.debug(
                f"Successfully wrote to InfluxDB: activity={activity_name}, case_id={case_id}"
            )
        except Exception as e:
            logger.error(
                f"Failed to write to InfluxDB: activity={activity_name}, case_id={case_id}, error={e}"
            )

    @classmethod
    def calculate_checksum(cls, data: dict[str, Any] | Any) -> str:
        if isinstance(data, dict):
            sorted_data = json.dumps(data, sort_keys=True, default=str)
        else:
            sorted_data = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(sorted_data.encode()).hexdigest()


def audit_log(activity_name: str | None = None):
    def decorator(func: Callable) -> Callable:
        sig = inspect.signature(func)
        param_names = list(sig.parameters.keys())
        info_param_index = None
        if "info" in param_names:
            info_param_index = param_names.index("info")

        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            logger.debug(
                f"Audit decorator called for function: {func.__name__}, args count: {len(args)}, kwargs: {list(kwargs.keys())}, param_names: {param_names}"
            )

            info = None

            if "info" in kwargs:
                info = kwargs["info"]
                logger.debug(
                    f"Found Info object in kwargs for {func.__name__}"
                )
            elif info_param_index is not None and len(args) > info_param_index:
                info = args[info_param_index]
                logger.debug(
                    f"Found Info object in args[{info_param_index}] for {func.__name__}"
                )
            else:
                for i, arg in enumerate(args):
                    if arg is None:
                        continue
                    try:
                        if hasattr(arg, "context"):
                            info = arg
                            logger.debug(
                                f"Found Info object in args[{i}] for {func.__name__} by context attribute"
                            )
                            break
                        elif hasattr(arg, "__class__"):
                            type_name = type(arg).__name__
                            if "Info" in type_name:
                                info = arg
                                logger.debug(
                                    f"Found Info object in args[{i}] for {func.__name__} by type name: {type_name}"
                                )
                                break
                    except Exception as e:
                        logger.debug(f"Error checking arg[{i}]: {e}")
                        continue

            if not info:
                logger.warning(
                    f"Audit decorator: No Info object found for {func.__name__}, skipping audit log. Args: {[type(a).__name__ if a is not None else 'None' for a in args]}, Kwargs keys: {list(kwargs.keys())}, info_param_index: {info_param_index}"
                )
                return await func(*args, **kwargs)

            if not hasattr(info, "context"):
                logger.warning(
                    f"Audit decorator: Info object found but no context attribute for {func.__name__}, skipping audit log"
                )
                return await func(*args, **kwargs)

            context = info.context
            user = context.user
            user_id = user.id if user else None

            case_id = None
            entity_id = None

            if "id" in kwargs:
                entity_id = str(kwargs["id"])
                logger.debug(
                    f"Found id in kwargs: {entity_id} for {func.__name__}"
                )
            elif len(args) > 1:
                logger.debug(
                    f"Checking args[1] for {func.__name__}: {type(args[1])}, value: {args[1]}"
                )
                if isinstance(args[1], str):
                    entity_id = args[1]
                elif hasattr(args[1], "__str__"):
                    entity_id = str(args[1])

            if entity_id:
                case_id = entity_id
                logger.debug(
                    f"Set case_id from entity_id: {case_id} for {func.__name__}"
                )

            activity = activity_name or func.__name__

            def serialize_payload(obj: Any) -> Any:
                if obj is None or obj is strawberry.UNSET:
                    return None
                elif isinstance(obj, (str, int, float, bool)):
                    return obj
                elif isinstance(obj, (date, datetime)):
                    return obj.isoformat()
                elif isinstance(obj, dict):
                    return {k: serialize_payload(v) for k, v in obj.items()}
                elif isinstance(obj, (list, tuple)):
                    return [serialize_payload(item) for item in obj]
                elif hasattr(obj, "value"):
                    return obj.value
                elif hasattr(obj, "__dict__"):
                    result = {}
                    for k, v in obj.__dict__.items():
                        if not k.startswith("_") and v is not strawberry.UNSET:
                            try:
                                serialized = serialize_payload(v)
                                if serialized is not None:
                                    result[k] = serialized
                            except Exception as e:
                                logger.debug(
                                    f"Error serializing field {k}: {e}"
                                )
                                result[k] = str(v)
                    return result
                elif hasattr(obj, "__annotations__"):
                    result = {}
                    annotations = obj.__annotations__
                    for attr_name in annotations.keys():
                        if not attr_name.startswith("_"):
                            try:
                                attr_value = getattr(obj, attr_name, None)
                                if (
                                    attr_value is not strawberry.UNSET
                                    and attr_value is not None
                                ):
                                    serialized = serialize_payload(attr_value)
                                    if serialized is not None:
                                        result[attr_name] = serialized
                            except Exception as e:
                                logger.debug(
                                    f"Error serializing annotation {attr_name}: {e}"
                                )
                                try:
                                    attr_value = getattr(obj, attr_name, None)
                                    if (
                                        attr_value is not strawberry.UNSET
                                        and attr_value is not None
                                    ):
                                        result[attr_name] = str(attr_value)
                                except Exception:
                                    pass
                    return result
                else:
                    try:
                        return str(obj)
                    except Exception:
                        return repr(obj)

            audit_context = {}
            payload = {}

            for key, value in kwargs.items():
                if key != "info":
                    try:
                        payload[key] = serialize_payload(value)
                    except Exception as e:
                        logger.debug(f"Error serializing {key}: {e}")
                        payload[key] = str(value)

            audit_context["payload"] = payload

            payload_json = json.dumps(payload, default=str)
            logger.debug(
                f"Calling function {func.__name__} with activity={activity}, case_id={case_id}, payload keys: {list(payload.keys())}, payload size: {len(payload_json)} bytes"
            )
            result = await func(*args, **kwargs)

            if hasattr(result, "id"):
                case_id = str(result.id)
                logger.debug(
                    f"Set case_id from result.id: {case_id} for {func.__name__}"
                )
            elif isinstance(result, dict) and "id" in result:
                case_id = str(result["id"])
                logger.debug(
                    f"Set case_id from result dict: {case_id} for {func.__name__}"
                )

            if case_id:
                logger.info(
                    f"Audit decorator: Logging activity {activity} for case_id {case_id} (user: {user_id}), payload included: {len(payload) > 0}"
                )
                AuditLogger.log_activity(
                    case_id=case_id,
                    activity_name=activity,
                    user_id=user_id,
                    context=audit_context,
                )
            else:
                logger.warning(
                    f"Audit decorator: No case_id found for {func.__name__}, skipping audit log. Result type: {type(result)}, has id attr: {hasattr(result, 'id') if result else 'N/A'}"
                )

            return result

        return wrapper

    return decorator

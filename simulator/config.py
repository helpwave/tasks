import logging
import os
import sys
from dotenv import load_dotenv

load_dotenv()

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
API_URL = os.getenv("API_URL", "http://localhost:8000/graphql")
REALM = os.getenv("REALM", "tasks")
USE_DIRECT_GRANT = os.getenv("USE_DIRECT_GRANT", "false").lower() == "true"
CLIENT_ID = os.getenv("CLIENT_ID", "tasks-web")
CLIENT_SECRET = os.getenv("CLIENT_SECRET", "")
USERNAME = os.getenv("USERNAME", "test")
PASSWORD = os.getenv("PASSWORD", "test")


def _env_int(key: str, default: int) -> int:
    raw = os.getenv(key)
    if raw is None or raw.strip() == "":
        return default
    return int(raw)


def _env_float(key: str, default: float) -> float:
    raw = os.getenv(key)
    if raw is None or raw.strip() == "":
        return default
    return float(raw)


SIMULATOR_INITIAL_MIN_PATIENTS = _env_int("SIMULATOR_INITIAL_MIN_PATIENTS", 25)
_loop_sleep_min = _env_float("SIMULATOR_LOOP_SLEEP_SECONDS_MIN", 0.12)
_loop_sleep_max = _env_float("SIMULATOR_LOOP_SLEEP_SECONDS_MAX", 0.45)
if _loop_sleep_min > _loop_sleep_max:
    _loop_sleep_min, _loop_sleep_max = _loop_sleep_max, _loop_sleep_min
SIMULATOR_LOOP_SLEEP_SECONDS_MIN = _loop_sleep_min
SIMULATOR_LOOP_SLEEP_SECONDS_MAX = _loop_sleep_max

CALLBACK_PORT = 8999
REDIRECT_URI = f"http://localhost:{CALLBACK_PORT}/callback"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

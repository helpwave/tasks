import os

from dotenv import load_dotenv

load_dotenv()

_db_hostname = os.getenv("DATABASE_HOSTNAME", "postgres")
_db_name = os.getenv("DATABASE_NAME", "postgres")
_db_username = os.getenv("DATABASE_USERNAME", "postgres")
_db_password = os.getenv("DATABASE_PASSWORD", "password")
_db_port = os.getenv("DATABASE_PORT", 5432)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql+asyncpg://{_db_username}:{_db_password}@{_db_hostname}:{_db_port}/{_db_name}",
)

_redis_host = os.getenv("REDIS_HOSTNAME", "localhost")
_redis_port = int(os.getenv("REDIS_PORT", 6379))
_redis_password = os.getenv("REDIS_PASSWORD", None)

if _redis_password:
    REDIS_URL = f"redis://:{_redis_password}@{_redis_host}:{_redis_port}/"
else:
    REDIS_URL = f"redis://{_redis_host}:{_redis_port}/"

REDIS_URL = os.getenv("REDIS_URL", REDIS_URL)

ENV = os.getenv("ENV", "production")
IS_DEV = ENV == "development"
DEV_MODE_NO_AUTH = os.getenv("DEV_MODE_NO_AUTH") == "true"
ALLOW_UNAUTHENTICATED_ACCESS = (
    os.getenv("ALLOW_UNAUTHENTICATED_ACCESS") == "true"
    or (IS_DEV and DEV_MODE_NO_AUTH)
)

LOGGER = os.getenv("LOGGER", "uvicorn")

ISSUER_URI = os.getenv("ISSUER_URI", "http://localhost:8080/realms/tasks")
PUBLIC_ISSUER_URI = os.getenv(
    "PUBLIC_ISSUER_URI",
    ISSUER_URI,
)
CLIENT_ID = os.getenv("CLIENT_ID", "tasks-backend")
CLIENT_SECRET = os.getenv("CLIENT_SECRET", "tasks-secret")
FRONTEND_CLIENT_ID = os.getenv("FRONTEND_CLIENT_ID", "tasks-web")

if IS_DEV:
    ALLOWED_ORIGINS = ["*"]
else:
    _allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
    ALLOWED_ORIGINS = [
        origin.strip()
        for origin in _allowed_origins_str.split(",")
        if origin.strip()
    ]

SCAFFOLD_DIRECTORY = os.getenv("SCAFFOLD_DIRECTORY", None)

INFLUXDB_URL = os.getenv("INFLUXDB_URL", "http://localhost:8086")
INFLUXDB_TOKEN = os.getenv("INFLUXDB_TOKEN", None)
INFLUXDB_ORG = os.getenv("INFLUXDB_ORG", "tasks")
INFLUXDB_BUCKET = os.getenv("INFLUXDB_BUCKET", "audit")

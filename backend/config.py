import os

_db_hostname = os.getenv("DATABASE_HOSTNAME", "postgres")
_db_name = os.getenv("DATABASE_NAME", "postgres")
_db_username = os.getenv("DATABASE_USERNAME", "postgres")
_db_password = os.getenv("DATABASE_PASSWORD", "password")
_db_port = os.getenv("DATABASE_PORT", 5432)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql+asyncpg://{_db_username}:{_db_password}@{_db_hostname}:{_db_port}/{_db_name}",
)


REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

ENV = os.getenv("ENV", "production")
IS_DEV = ENV == "development"

LOGGER = os.getenv("LOGGER", "uvicorn")

ISSUER_URI = os.getenv("ISSUER_URI", "http://localhost:8080/realms/main")
CLIENT_ID = os.getenv("CLIENT_ID", "tasks")
CLIENT_SECRET = os.getenv("CLIENT_SECRET", "YQpu11TmMF3vPU53iaqQlKhlcYNPBt4l")

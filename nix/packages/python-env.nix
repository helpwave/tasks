{
  python3,
  lib,
  withTestDeps ? false,
}:

python3.withPackages (
  ps:
  with ps;
  [
    alembic
    asyncpg
    cryptography
    fastapi
    httptools
    influxdb-client
    openpyxl
    python-dotenv
    python-jose
    python-multipart
    redis
    requests
    sqlalchemy
    strawberry-graphql
    tzdata
    uvicorn
    uvloop
    websockets
  ]
  ++ lib.optionals withTestDeps [
    aiosqlite
    httpx
    pytest
    pytest-asyncio
    pytest-cov
  ]
)

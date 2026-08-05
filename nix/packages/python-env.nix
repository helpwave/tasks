{ python3 }:

python3.withPackages (
  ps: with ps; [
    aiosqlite
    alembic
    asyncpg
    cryptography
    fastapi
    httpx
    httptools
    influxdb-client
    openpyxl
    pytest
    pytest-asyncio
    pytest-cov
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
    watchfiles
    websockets
  ]
)

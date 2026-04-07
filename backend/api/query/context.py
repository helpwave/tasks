from dataclasses import dataclass, field
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase


@dataclass
class QueryCompileContext:
    db: AsyncSession
    root_model: type[DeclarativeBase]
    entity_key: str
    aliases: dict[str, Any] = field(default_factory=dict)
    needs_distinct: bool = False

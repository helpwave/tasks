from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from database.models.base import Base
from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from database.models.task import Task
    from database.models.user import User


class TaskPresetScope(str, enum.Enum):
    PERSONAL = "PERSONAL"
    GLOBAL = "GLOBAL"


class TaskPreset(Base):
    __tablename__ = "task_presets"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    name: Mapped[str] = mapped_column(String)
    key: Mapped[str] = mapped_column(String, unique=True, index=True)
    scope: Mapped[str] = mapped_column(String(32))
    owner_user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )
    graph_json: Mapped[dict[str, Any]] = mapped_column(JSON)
    creation_date: Mapped[datetime] = mapped_column(default=datetime.now)
    update_date: Mapped[datetime | None] = mapped_column(
        nullable=True,
        default=datetime.now,
        onupdate=datetime.now,
    )

    owner: Mapped[User | None] = relationship("User")
    tasks: Mapped[list["Task"]] = relationship(
        "Task",
        back_populates="source_task_preset",
    )

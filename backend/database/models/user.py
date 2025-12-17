from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from database.session import Base
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .task import Task


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    username: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    firstname: Mapped[str | None] = mapped_column(String, nullable=True)
    lastname: Mapped[str | None] = mapped_column(String, nullable=True)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        default="https://cdn.helpwave.de/boringavatar.svg",
    )
    organizations: Mapped[str | None] = mapped_column(String, nullable=True)

    tasks: Mapped[list[Task]] = relationship("Task", back_populates="assignee")

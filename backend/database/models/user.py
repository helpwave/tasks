from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from database.models.base import Base
from sqlalchemy import Column, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .location import LocationNode
    from .task import Task

user_root_locations = Table(
    "user_root_locations",
    Base.metadata,
    Column("user_id", ForeignKey("users.id"), primary_key=True),
    Column("location_id", ForeignKey("location_nodes.id"), primary_key=True),
)


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

    tasks: Mapped[list[Task]] = relationship("Task", back_populates="assignee")
    root_locations: Mapped[list[LocationNode]] = relationship(
        "LocationNode",
        secondary=user_root_locations,
        back_populates="root_users",
    )

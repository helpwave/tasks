from __future__ import annotations

import uuid
from datetime import date
from typing import TYPE_CHECKING

from database.session import Base
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .location import LocationNode
    from .property import PropertyValue
    from .task import Task


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    firstname: Mapped[str] = mapped_column(String)
    lastname: Mapped[str] = mapped_column(String)
    birthdate: Mapped[date] = mapped_column()
    sex: Mapped[str] = mapped_column(String)
    assigned_location_id: Mapped[str | None] = mapped_column(
        ForeignKey("location_nodes.id"),
        nullable=True,
    )

    assigned_location: Mapped[LocationNode | None] = relationship(
        "LocationNode",
        back_populates="patients",
    )
    tasks: Mapped[list[Task]] = relationship(
        "Task",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    properties: Mapped[list[PropertyValue]] = relationship(
        "PropertyValue",
        back_populates="patient",
        cascade="all, delete-orphan",
    )

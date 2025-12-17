from __future__ import annotations

import uuid
from datetime import date
from typing import TYPE_CHECKING

from database.session import Base
from sqlalchemy import Column, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .location import LocationNode
    from .property import PropertyValue
    from .task import Task

patient_locations = Table(
    "patient_locations",
    Base.metadata,
    Column("patient_id", ForeignKey("patients.id"), primary_key=True),
    Column("location_id", ForeignKey("location_nodes.id"), primary_key=True),
)

patient_teams = Table(
    "patient_teams",
    Base.metadata,
    Column("patient_id", ForeignKey("patients.id"), primary_key=True),
    Column("location_id", ForeignKey("location_nodes.id"), primary_key=True),
)


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
    state: Mapped[str] = mapped_column(String, default="WAIT")
    assigned_location_id: Mapped[str | None] = mapped_column(
        ForeignKey("location_nodes.id"),
        nullable=True,
    )
    clinic_id: Mapped[str] = mapped_column(
        ForeignKey("location_nodes.id"),
        nullable=False,
    )
    position_id: Mapped[str | None] = mapped_column(
        ForeignKey("location_nodes.id"),
        nullable=True,
    )

    assigned_locations: Mapped[list[LocationNode]] = relationship(
        "LocationNode",
        secondary=patient_locations,
        back_populates="patients",
    )
    assigned_location: Mapped[LocationNode | None] = relationship(
        "LocationNode",
        foreign_keys=[assigned_location_id],
        back_populates="legacy_patients",
    )
    clinic: Mapped[LocationNode] = relationship(
        "LocationNode",
        foreign_keys=[clinic_id],
        back_populates="patients_as_clinic",
    )
    position: Mapped[LocationNode | None] = relationship(
        "LocationNode",
        foreign_keys=[position_id],
        back_populates="patients_as_position",
    )
    teams: Mapped[list[LocationNode]] = relationship(
        "LocationNode",
        secondary=patient_teams,
        back_populates="patients_as_teams",
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

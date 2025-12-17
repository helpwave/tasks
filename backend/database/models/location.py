from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from database.session import Base
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .patient import Patient


class LocationNode(Base):
    __tablename__ = "location_nodes"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    title: Mapped[str] = mapped_column(String)
    kind: Mapped[str] = mapped_column(String)
    parent_id: Mapped[str | None] = mapped_column(
        ForeignKey("location_nodes.id"),
        nullable=True,
    )

    parent: Mapped[LocationNode | None] = relationship(
        "LocationNode",
        remote_side=[id],
        back_populates="children",
    )
    children: Mapped[list[LocationNode]] = relationship(
        "LocationNode",
        back_populates="parent",
    )
    patients: Mapped[list[Patient]] = relationship(
        "Patient",
        secondary="patient_locations",
        back_populates="assigned_locations",
    )
    legacy_patients: Mapped[list[Patient]] = relationship(
        "Patient",
        foreign_keys="Patient.assigned_location_id",
        back_populates="assigned_location",
    )
    patients_as_clinic: Mapped[list[Patient]] = relationship(
        "Patient",
        foreign_keys="Patient.clinic_id",
        back_populates="clinic",
    )
    patients_as_position: Mapped[list[Patient]] = relationship(
        "Patient",
        foreign_keys="Patient.position_id",
        back_populates="position",
    )
    patients_as_teams: Mapped[list[Patient]] = relationship(
        "Patient",
        secondary="patient_teams",
        back_populates="teams",
    )

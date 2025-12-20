from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from database.models.base import Base
from sqlalchemy import Boolean, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .patient import Patient
    from .task import Task


class PropertyDefinition(Base):
    __tablename__ = "property_definitions"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    field_type: Mapped[str] = mapped_column(String)
    options: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    allowed_entities: Mapped[str] = mapped_column(String, default="PATIENT")


class PropertyValue(Base):
    __tablename__ = "property_values"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    definition_id: Mapped[str] = mapped_column(
        ForeignKey("property_definitions.id"),
    )
    patient_id: Mapped[str | None] = mapped_column(
        ForeignKey("patients.id"),
        nullable=True,
    )
    task_id: Mapped[str | None] = mapped_column(
        ForeignKey("tasks.id"),
        nullable=True,
    )

    definition: Mapped[PropertyDefinition] = relationship("PropertyDefinition")
    patient: Mapped[Patient | None] = relationship(
        "Patient",
        back_populates="properties",
    )
    task: Mapped[Task | None] = relationship(
        "Task",
        back_populates="properties",
    )

    text_value: Mapped[str | None] = mapped_column(String, nullable=True)
    number_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    boolean_value: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    date_value: Mapped[date | None] = mapped_column(nullable=True)
    date_time_value: Mapped[datetime | None] = mapped_column(nullable=True)
    select_value: Mapped[str | None] = mapped_column(String, nullable=True)
    multi_select_values: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

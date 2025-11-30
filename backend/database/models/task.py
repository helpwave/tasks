from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from database.session import Base
from sqlalchemy import Boolean, Column, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .patient import Patient
    from .property import PropertyValue
    from .user import User

task_dependencies = Table(
    "task_dependencies",
    Base.metadata,
    Column("previous_task_id", ForeignKey("tasks.id"), primary_key=True),
    Column("next_task_id", ForeignKey("tasks.id"), primary_key=True),
)


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    done: Mapped[bool] = mapped_column(Boolean, default=False)
    creation_date: Mapped[datetime] = mapped_column(default=datetime.now)
    update_date: Mapped[datetime | None] = mapped_column(
        nullable=True, onupdate=datetime.now
    )
    assignee_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"))

    assignee: Mapped[User | None] = relationship(
        "User", back_populates="tasks"
    )
    patient: Mapped[Patient] = relationship("Patient", back_populates="tasks")
    properties: Mapped[list[PropertyValue]] = relationship(
        "PropertyValue", back_populates="task", cascade="all, delete-orphan"
    )

    previous_tasks: Mapped[list[Task]] = relationship(
        "Task",
        secondary=task_dependencies,
        primaryjoin=id == task_dependencies.c.next_task_id,
        secondaryjoin=id == task_dependencies.c.previous_task_id,
        back_populates="following_tasks",
    )

    following_tasks: Mapped[list[Task]] = relationship(
        "Task",
        secondary=task_dependencies,
        primaryjoin=id == task_dependencies.c.previous_task_id,
        secondaryjoin=id == task_dependencies.c.next_task_id,
        back_populates="previous_tasks",
    )

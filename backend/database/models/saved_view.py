from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from database.models.base import Base
from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .user import User


class SavedView(Base):
    """
    Persistent user-defined view: saved filters, sort, scope (parameters), and entity type.
    filter_definition / sort_definition / parameters store JSON as text (SQLite + Postgres compatible).
    """

    __tablename__ = "saved_views"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    base_entity_type: Mapped[str] = mapped_column(
        String, nullable=False
    )  # 'task' | 'patient'
    filter_definition: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    sort_definition: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    parameters: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    owner_user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )
    visibility: Mapped[str] = mapped_column(
        String, nullable=False, default="private"
    )  # 'private' | 'link_shared'
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    owner: Mapped["User"] = relationship("User", back_populates="saved_views")

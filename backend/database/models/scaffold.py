from database.models.base import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String


class ScaffoldImportState(Base):
    __tablename__ = "scaffold_import_state"

    key: Mapped[str] = mapped_column(String, primary_key=True)
    value: Mapped[str] = mapped_column(String)

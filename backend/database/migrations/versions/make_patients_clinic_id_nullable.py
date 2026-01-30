"""Make patients.clinic_id nullable for scaffold FORCE unassign

Revision ID: make_patients_clinic_nullable
Revises: 655294b10318
Create Date: 2026-01-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "make_patients_clinic_nullable"
down_revision: Union[str, Sequence[str], None] = "655294b10318"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "patients",
        "clinic_id",
        existing_type=sa.String(),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "patients",
        "clinic_id",
        existing_type=sa.String(),
        nullable=False,
    )

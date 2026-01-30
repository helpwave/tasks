"""Make patients.clinic_id required again

Revision ID: make_patients_clinic_required
Revises: make_patients_clinic_nullable
Create Date: 2026-01-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "make_patients_clinic_required"
down_revision: Union[str, Sequence[str], None] = "make_patients_clinic_nullable"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "patients",
        "clinic_id",
        existing_type=sa.String(),
        nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "patients",
        "clinic_id",
        existing_type=sa.String(),
        nullable=True,
    )

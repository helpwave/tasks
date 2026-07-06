"""Add per-field update timestamps to patients.

Revision ID: add_patient_field_update_ts
Revises: add_patient_updated_at
Create Date: 2026-07-05 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "add_patient_field_update_ts"
down_revision: Union[str, Sequence[str], None] = "add_patient_updated_at"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "patients",
        sa.Column("state_updated_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "patients",
        sa.Column("clinic_updated_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "patients",
        sa.Column("position_updated_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("patients", "position_updated_at")
    op.drop_column("patients", "clinic_updated_at")
    op.drop_column("patients", "state_updated_at")

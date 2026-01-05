"""Add description field to patients.

Revision ID: add_patient_description
Revises: add_patient_deleted
Create Date: 2025-01-15 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "add_patient_description"
down_revision: Union[str, Sequence[str], None] = "add_patient_deleted"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "patients",
        sa.Column("description", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("patients", "description")








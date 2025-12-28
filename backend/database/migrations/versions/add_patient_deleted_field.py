"""Add deleted field to patients for soft delete

Revision ID: add_patient_deleted
Revises: add_task_priority_time
Create Date: 2025-12-28 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "add_patient_deleted"
down_revision: Union[str, Sequence[str], None] = "add_task_priority_time"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "patients",
        sa.Column("deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("patients", "deleted")


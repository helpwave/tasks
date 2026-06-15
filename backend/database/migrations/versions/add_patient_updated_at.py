"""Add updated_at to patients.

Revision ID: add_patient_updated_at
Revises: add_task_source_preset
Create Date: 2026-06-15 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "add_patient_updated_at"
down_revision: Union[str, Sequence[str], None] = "add_task_source_preset"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "patients",
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.execute(
        """
        UPDATE patients
        SET updated_at = (
            SELECT MAX(tasks.update_date)
            FROM tasks
            WHERE tasks.patient_id = patients.id
        )
        WHERE EXISTS (
            SELECT 1 FROM tasks WHERE tasks.patient_id = patients.id
        )
        """
    )


def downgrade() -> None:
    op.drop_column("patients", "updated_at")

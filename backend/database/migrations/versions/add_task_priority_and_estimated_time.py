"""Add priority and estimated_time to tasks.

Revision ID: add_task_priority_time
Revises: 0de3078888ba
Create Date: 2025-12-19 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "add_task_priority_time"
down_revision: Union[str, Sequence[str], None] = "0de3078888ba"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column("priority", sa.String(), nullable=True),
    )
    op.add_column(
        "tasks",
        sa.Column("estimated_time", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("tasks", "estimated_time")
    op.drop_column("tasks", "priority")

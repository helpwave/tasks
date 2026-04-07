"""Add source_task_preset_id to tasks.

Revision ID: add_task_source_preset
Revises: add_task_presets
Create Date: 2026-04-07
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "add_task_source_preset"
down_revision: Union[str, Sequence[str], None] = "add_task_presets"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column("source_task_preset_id", sa.String(), nullable=True),
    )
    op.create_foreign_key(
        "fk_tasks_source_task_preset_id",
        "tasks",
        "task_presets",
        ["source_task_preset_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_tasks_source_task_preset_id",
        "tasks",
        type_="foreignkey",
    )
    op.drop_column("tasks", "source_task_preset_id")

"""Add task_presets table.

Revision ID: add_task_presets
Revises: add_saved_view_related_columns
Create Date: 2026-04-07 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "add_task_presets"
down_revision: Union[str, Sequence[str], None] = "add_saved_view_related_columns"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "task_presets",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("scope", sa.String(length=32), nullable=False),
        sa.Column("owner_user_id", sa.String(), nullable=True),
        sa.Column(
            "graph_json",
            postgresql.JSON(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("creation_date", sa.DateTime(), nullable=False),
        sa.Column("update_date", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_task_presets_key"),
        "task_presets",
        ["key"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_task_presets_key"), table_name="task_presets")
    op.drop_table("task_presets")

"""Add related_* columns for opposite-tab table state on saved_views.

Revision ID: add_saved_view_related_columns
Revises: merge_saved_views_task_assignees
Create Date: 2026-04-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "add_saved_view_related_columns"
down_revision: Union[str, Sequence[str], None] = "merge_saved_views_task_assignees"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "saved_views",
        sa.Column(
            "related_filter_definition",
            sa.Text(),
            nullable=False,
            server_default="{}",
        ),
    )
    op.add_column(
        "saved_views",
        sa.Column(
            "related_sort_definition",
            sa.Text(),
            nullable=False,
            server_default="{}",
        ),
    )
    op.add_column(
        "saved_views",
        sa.Column(
            "related_parameters",
            sa.Text(),
            nullable=False,
            server_default="{}",
        ),
    )
    op.alter_column("saved_views", "related_filter_definition", server_default=None)
    op.alter_column("saved_views", "related_sort_definition", server_default=None)
    op.alter_column("saved_views", "related_parameters", server_default=None)


def downgrade() -> None:
    op.drop_column("saved_views", "related_parameters")
    op.drop_column("saved_views", "related_sort_definition")
    op.drop_column("saved_views", "related_filter_definition")

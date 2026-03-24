"""Merge migration heads: saved_views and task_assignees branches.

Revision ID: merge_saved_views_task_assignees
Revises: add_saved_views_table, task_assignees_opt_patient
Create Date: 2026-03-23

"""

from typing import Sequence, Union

from alembic import op

revision: str = "merge_saved_views_task_assignees"
down_revision: Union[str, Sequence[str], None] = (
    "add_saved_views_table",
    "task_assignees_opt_patient",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

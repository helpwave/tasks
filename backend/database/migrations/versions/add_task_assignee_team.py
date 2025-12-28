"""Add assignee_team_id to tasks for team assignment

Revision ID: add_task_assignee_team
Revises: add_patient_deleted
Create Date: 2025-12-28 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "add_task_assignee_team"
down_revision: Union[str, Sequence[str], None] = "add_patient_deleted"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column("assignee_team_id", sa.String(), nullable=True),
    )
    op.create_foreign_key(
        "fk_tasks_assignee_team_id",
        "tasks",
        "location_nodes",
        ["assignee_team_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_tasks_assignee_team_id", "tasks", type_="foreignkey")
    op.drop_column("tasks", "assignee_team_id")


"""Add task_assignees table and make task patient optional.

Revision ID: task_assignees_opt_patient
Revises: add_patient_deleted
Create Date: 2026-03-23 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "task_assignees_opt_patient"
down_revision: Union[str, Sequence[str], None] = "add_patient_deleted"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _drop_fk_for_column(table_name: str, column_name: str) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    for fk in inspector.get_foreign_keys(table_name):
        constrained_columns = fk.get("constrained_columns", [])
        if column_name in constrained_columns and fk.get("name"):
            op.drop_constraint(fk["name"], table_name, type_="foreignkey")
            break


def upgrade() -> None:
    op.create_table(
        "task_assignees",
        sa.Column("task_id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("task_id", "user_id"),
    )

    op.execute(
        sa.text(
            """
            INSERT INTO task_assignees (task_id, user_id)
            SELECT id, assignee_id
            FROM tasks
            WHERE assignee_id IS NOT NULL
            """
        )
    )

    _drop_fk_for_column("tasks", "assignee_id")
    op.drop_column("tasks", "assignee_id")
    op.alter_column("tasks", "patient_id", existing_type=sa.String(), nullable=True)


def downgrade() -> None:
    op.add_column("tasks", sa.Column("assignee_id", sa.String(), nullable=True))
    op.create_foreign_key(
        "tasks_assignee_id_fkey",
        "tasks",
        "users",
        ["assignee_id"],
        ["id"],
    )

    op.execute(
        sa.text(
            """
            UPDATE tasks
            SET assignee_id = sub.user_id
            FROM (
                SELECT task_id, MIN(user_id) AS user_id
                FROM task_assignees
                GROUP BY task_id
            ) AS sub
            WHERE tasks.id = sub.task_id
            """
        )
    )

    op.alter_column("tasks", "patient_id", existing_type=sa.String(), nullable=False)
    op.drop_table("task_assignees")

"""Scope presets, saved views and property definitions to a location node.

Revision ID: add_scope_visibility
Revises: add_scope_location_prop_view
Create Date: 2026-09-02 12:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "add_scope_visibility"
down_revision: Union[str, Sequence[str], None] = "add_scope_location_prop_view"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _root_location_id(conn) -> str | None:
    rows = conn.execute(
        sa.text(
            "SELECT id FROM location_nodes WHERE parent_id IS NULL ORDER BY title, id"
        )
    ).fetchall()
    return rows[0][0] if rows else None


def upgrade() -> None:
    conn = op.get_bind()
    root_id = _root_location_id(conn)

    with op.batch_alter_table("property_definitions") as batch_op:
        batch_op.add_column(
            sa.Column(
                "visibility",
                sa.String(length=16),
                nullable=False,
                server_default="private",
            )
        )
        batch_op.add_column(sa.Column("owner_user_id", sa.String(), nullable=True))
        batch_op.create_foreign_key(
            "fk_property_definitions_owner_user_id",
            "users",
            ["owner_user_id"],
            ["id"],
        )
    conn.execute(sa.text("UPDATE property_definitions SET visibility = 'public'"))
    if root_id:
        conn.execute(
            sa.text(
                "UPDATE property_definitions SET location_id = :root_id "
                "WHERE location_id IS NULL"
            ),
            {"root_id": root_id},
        )

    conn.execute(
        sa.text("UPDATE saved_views SET visibility = 'private', location_id = NULL")
    )

    with op.batch_alter_table("task_presets") as batch_op:
        batch_op.add_column(
            sa.Column(
                "visibility",
                sa.String(length=16),
                nullable=False,
                server_default="private",
            )
        )
        batch_op.add_column(sa.Column("location_id", sa.String(), nullable=True))
        batch_op.create_foreign_key(
            "fk_task_presets_location_id",
            "location_nodes",
            ["location_id"],
            ["id"],
        )
    if root_id:
        conn.execute(
            sa.text(
                "UPDATE task_presets SET visibility = 'public', location_id = :root_id "
                "WHERE owner_user_id IS NULL"
            ),
            {"root_id": root_id},
        )
    with op.batch_alter_table("task_presets") as batch_op:
        batch_op.drop_column("scope")


def downgrade() -> None:
    conn = op.get_bind()

    with op.batch_alter_table("task_presets") as batch_op:
        batch_op.add_column(
            sa.Column(
                "scope",
                sa.String(length=32),
                nullable=False,
                server_default="PERSONAL",
            )
        )
    conn.execute(
        sa.text("UPDATE task_presets SET scope = 'GLOBAL' WHERE visibility = 'public'")
    )
    with op.batch_alter_table("task_presets") as batch_op:
        batch_op.drop_constraint("fk_task_presets_location_id", type_="foreignkey")
        batch_op.drop_column("location_id")
        batch_op.drop_column("visibility")

    with op.batch_alter_table("property_definitions") as batch_op:
        batch_op.drop_constraint(
            "fk_property_definitions_owner_user_id", type_="foreignkey"
        )
        batch_op.drop_column("owner_user_id")
        batch_op.drop_column("visibility")

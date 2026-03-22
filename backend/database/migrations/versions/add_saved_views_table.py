"""Add saved_views table for persistent user views.

Revision ID: add_saved_views_table
Revises: add_property_value_user_value
Create Date: 2026-02-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "add_saved_views_table"
down_revision: Union[str, Sequence[str], None] = "add_property_value_user_value"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "saved_views",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("base_entity_type", sa.String(), nullable=False),
        sa.Column("filter_definition", sa.Text(), nullable=False),
        sa.Column("sort_definition", sa.Text(), nullable=False),
        sa.Column("parameters", sa.Text(), nullable=False),
        sa.Column("owner_user_id", sa.String(), nullable=False),
        sa.Column("visibility", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("saved_views")

"""Add user_value column to property_values

Revision ID: add_property_value_user_value
Revises: add_scaffold_import_state
Create Date: 2026-02-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "add_property_value_user_value"
down_revision: Union[str, Sequence[str], None] = "add_scaffold_import_state"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "property_values",
        sa.Column("user_value", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("property_values", "user_value")

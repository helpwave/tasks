"""Add location organizations table.

Revision ID: add_location_organizations_table
Revises: add_user_root_locations
Create Date: 2025-01-17 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "add_location_organizations_table"
down_revision: Union[str, Sequence[str], None] = "add_user_root_locations"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "location_organizations",
        sa.Column("location_id", sa.String(), nullable=False),
        sa.Column("organization_id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["location_id"], ["location_nodes.id"]),
        sa.PrimaryKeyConstraint("location_id", "organization_id"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("location_organizations")


"""Add user root locations table.

Revision ID: add_user_root_locations
Revises: add_patient_location_mapping
Create Date: 2025-01-16 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "add_user_root_locations"
down_revision: Union[str, Sequence[str], None] = "add_patient_location_mapping"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "user_root_locations",
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("location_id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["location_id"], ["location_nodes.id"]),
        sa.PrimaryKeyConstraint("user_id", "location_id"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("user_root_locations")


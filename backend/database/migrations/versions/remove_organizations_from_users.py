"""Remove organizations field from users table.

Revision ID: remove_organizations_from_users
Revises: add_user_root_locations
Create Date: 2025-01-16 12:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "remove_organizations_from_users"
down_revision: Union[str, Sequence[str], None] = "add_user_root_locations"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column("users", "organizations")


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column("users", sa.Column("organizations", sa.String(), nullable=True))


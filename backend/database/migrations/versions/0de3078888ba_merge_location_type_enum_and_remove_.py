"""Merge location type enum and remove organizations

Revision ID: 0de3078888ba
Revises: add_location_type_enum, remove_organizations_from_users
Create Date: 2025-12-23 22:12:52.604315

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0de3078888ba'
down_revision: Union[str, Sequence[str], None] = ('add_location_type_enum', 'remove_organizations_from_users')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

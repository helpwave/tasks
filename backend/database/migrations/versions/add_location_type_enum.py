"""Add location type enum.

Revision ID: add_location_type_enum
Revises: add_location_organizations_table
Create Date: 2025-01-17 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "add_location_type_enum"
down_revision: Union[str, Sequence[str], None] = "add_location_organizations_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        'location_nodes',
        'kind',
        type_=sa.Enum(
            'HOSPITAL', 'PRACTICE', 'CLINIC', 'TEAM', 'WARD', 'ROOM', 'BED', 'OTHER',
            name='locationtypeenum',
            native_enum=False,
            length=50
        ),
        existing_type=sa.String(),
        existing_nullable=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'location_nodes',
        'kind',
        type_=sa.String(),
        existing_type=sa.Enum(
            'HOSPITAL', 'PRACTICE', 'CLINIC', 'TEAM', 'WARD', 'ROOM', 'BED', 'OTHER',
            name='locationtypeenum',
            native_enum=False,
            length=50
        ),
        existing_nullable=False
    )


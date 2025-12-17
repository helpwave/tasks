"""Add email and organizations fields to users table

Revision ID: add_user_email_and_organizations
Revises: add_patient_state
Create Date: 2025-12-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_user_email_and_organizations'
down_revision: Union[str, Sequence[str], None] = 'add_patient_state'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('email', sa.String(), nullable=True))
    op.add_column('users', sa.Column('organizations', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'organizations')
    op.drop_column('users', 'email')


"""add_user_last_online

Revision ID: 655294b10318
Revises: 81ffadeee438
Create Date: 2026-01-05 23:43:26.978266

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '655294b10318'
down_revision: Union[str, Sequence[str], None] = ('0de3078888ba', '81ffadeee438')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "users",
        sa.Column("last_online", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("users", "last_online")

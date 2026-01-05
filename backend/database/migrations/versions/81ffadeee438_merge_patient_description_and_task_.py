"""merge patient description and task assignee team

Revision ID: 81ffadeee438
Revises: add_patient_description, add_task_assignee_team
Create Date: 2026-01-01 21:39:27.052533

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '81ffadeee438'
down_revision: Union[str, Sequence[str], None] = ('add_patient_description', 'add_task_assignee_team')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

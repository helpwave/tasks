from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'add_patient_state'
down_revision: Union[str, Sequence[str], None] = 'add_patient_locations'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('patients', sa.Column('state', sa.String(), nullable=False, server_default='WAIT'))

def downgrade() -> None:
    op.drop_column('patients', 'state')


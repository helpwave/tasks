"""Add patient_locations many-to-many table

Revision ID: add_patient_locations
Revises: baace9e34585
Create Date: 2025-12-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_patient_locations'
down_revision: Union[str, Sequence[str], None] = 'baace9e34585'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create the association table
    op.create_table(
        'patient_locations',
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('location_id', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.ForeignKeyConstraint(['location_id'], ['location_nodes.id'], ),
        sa.PrimaryKeyConstraint('patient_id', 'location_id')
    )
    
    # Migrate existing single location assignments to the new table
    op.execute("""
        INSERT INTO patient_locations (patient_id, location_id)
        SELECT id, assigned_location_id
        FROM patients
        WHERE assigned_location_id IS NOT NULL
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('patient_locations')

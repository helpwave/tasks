"""Add patient location mapping fields (clinic, position, teams)

Revision ID: add_patient_location_mapping
Revises: add_patient_locations
Create Date: 2025-01-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_patient_location_mapping'
down_revision: Union[str, Sequence[str], None] = 'add_user_email_and_organizations'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('patients', sa.Column('clinic_id', sa.String(), nullable=True))
    
    op.add_column('patients', sa.Column('position_id', sa.String(), nullable=True))
    
    op.create_foreign_key(
        'fk_patients_clinic_id',
        'patients',
        'location_nodes',
        ['clinic_id'],
        ['id']
    )
    op.create_foreign_key(
        'fk_patients_position_id',
        'patients',
        'location_nodes',
        ['position_id'],
        ['id']
    )
    
    op.create_table(
        'patient_teams',
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('location_id', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.ForeignKeyConstraint(['location_id'], ['location_nodes.id']),
        sa.PrimaryKeyConstraint('patient_id', 'location_id')
    )
    
    op.execute("""
        UPDATE patients p
        SET clinic_id = (
            SELECT location_id
            FROM patient_locations pl
            JOIN location_nodes ln ON pl.location_id = ln.id
            WHERE pl.patient_id = p.id
            AND ln.kind = 'CLINIC'
            LIMIT 1
        )
        WHERE EXISTS (
            SELECT 1 FROM patient_locations pl2 WHERE pl2.patient_id = p.id
        )
    """)
    
    op.execute("""
        UPDATE patients p
        SET clinic_id = (
            SELECT location_id
            FROM patient_locations pl
            WHERE pl.patient_id = p.id
            LIMIT 1
        )
        WHERE clinic_id IS NULL
        AND EXISTS (
            SELECT 1 FROM patient_locations pl2 WHERE pl2.patient_id = p.id
        )
    """)
    
    op.execute("""
        UPDATE patients
        SET clinic_id = assigned_location_id
        WHERE clinic_id IS NULL
        AND assigned_location_id IS NOT NULL
    """)
    
    op.execute("""
        UPDATE patients p
        SET clinic_id = (
            SELECT id FROM location_nodes WHERE kind = 'CLINIC' LIMIT 1
        )
        WHERE clinic_id IS NULL
    """)
    
    op.alter_column('patients', 'clinic_id', nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('patient_teams')
    op.drop_constraint('fk_patients_position_id', 'patients', type_='foreignkey')
    op.drop_constraint('fk_patients_clinic_id', 'patients', type_='foreignkey')
    op.drop_column('patients', 'position_id')
    op.drop_column('patients', 'clinic_id')


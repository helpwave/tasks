"""Add scaffold_import_state table for directory hash

Revision ID: add_scaffold_import_state
Revises: make_patients_clinic_required
Create Date: 2026-01-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "add_scaffold_import_state"
down_revision: Union[str, Sequence[str], None] = "make_patients_clinic_required"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "scaffold_import_state",
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("value", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("key"),
    )


def downgrade() -> None:
    op.drop_table("scaffold_import_state")

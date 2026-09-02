"""Attach property definitions and saved views to a scaffold location.

Adds a nullable ``location_id`` foreign key to ``property_definitions`` and
``saved_views`` so both can be authorized against the location (scaffold)
hierarchy. Existing rows keep ``NULL`` (legacy/global, read-only for
definitions; owner-only for views).

Revision ID: add_scope_location_prop_view
Revises: add_patient_field_update_ts
Create Date: 2026-09-02 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "add_scope_location_prop_view"
down_revision: Union[str, Sequence[str], None] = "add_patient_field_update_ts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("property_definitions") as batch_op:
        batch_op.add_column(
            sa.Column("location_id", sa.String(), nullable=True)
        )
        batch_op.create_foreign_key(
            "fk_property_definitions_location_id",
            "location_nodes",
            ["location_id"],
            ["id"],
        )

    with op.batch_alter_table("saved_views") as batch_op:
        batch_op.add_column(
            sa.Column("location_id", sa.String(), nullable=True)
        )
        batch_op.create_foreign_key(
            "fk_saved_views_location_id",
            "location_nodes",
            ["location_id"],
            ["id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("saved_views") as batch_op:
        batch_op.drop_constraint(
            "fk_saved_views_location_id", type_="foreignkey"
        )
        batch_op.drop_column("location_id")

    with op.batch_alter_table("property_definitions") as batch_op:
        batch_op.drop_constraint(
            "fk_property_definitions_location_id", type_="foreignkey"
        )
        batch_op.drop_column("location_id")

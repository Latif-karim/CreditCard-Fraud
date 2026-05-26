"""Add user approval flag

Revision ID: d9e8f7a6b5c4
Revises: c8f1a2b3d4e5
Create Date: 2026-05-26

"""

from alembic import op
import sqlalchemy as sa


revision = "d9e8f7a6b5c4"
down_revision = "c8f1a2b3d4e5"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.add_column(sa.Column("approved", sa.Boolean(), nullable=False, server_default="1"))

    user_table = sa.table("user", sa.column("approved", sa.Boolean))
    op.execute(
        user_table.update()
        .where(user_table.c.approved.is_(None))
        .values(approved=True)
    )


def downgrade():
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.drop_column("approved")

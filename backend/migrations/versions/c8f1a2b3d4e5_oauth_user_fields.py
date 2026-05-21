"""OAuth provider fields on user

Revision ID: c8f1a2b3d4e5
Revises: a1b2c3d4e5f6
Create Date: 2026-05-21

"""

from alembic import op
import sqlalchemy as sa


revision = "c8f1a2b3d4e5"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.add_column(sa.Column("auth_provider", sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column("oauth_subject", sa.String(length=128), nullable=True))
        batch_op.alter_column("password_hash", existing_type=sa.String(length=128), nullable=True)

    op.execute("UPDATE user SET auth_provider = 'email' WHERE auth_provider IS NULL")


def downgrade():
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.drop_column("oauth_subject")
        batch_op.drop_column("auth_provider")
        batch_op.alter_column("password_hash", existing_type=sa.String(length=128), nullable=False)

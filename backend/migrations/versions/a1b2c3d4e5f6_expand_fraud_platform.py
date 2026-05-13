"""expand fraud platform

Revision ID: a1b2c3d4e5f6
Revises: 20d7d22b4f8c
Create Date: 2026-05-13

"""
from alembic import op
import sqlalchemy as sa

revision = "a1b2c3d4e5f6"
down_revision = "20d7d22b4f8c"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("user") as batch:
        batch.add_column(sa.Column("full_name", sa.String(length=120), nullable=True))
        batch.add_column(sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"))
        batch.add_column(sa.Column("email_verified", sa.Boolean(), nullable=False, server_default="0"))
        batch.add_column(sa.Column("two_factor_enabled", sa.Boolean(), nullable=False, server_default="0"))

    with op.batch_alter_table("transaction") as batch:
        batch.add_column(sa.Column("country", sa.String(length=80), nullable=True))
        batch.add_column(sa.Column("merchant_category", sa.String(length=80), nullable=True))
        batch.add_column(sa.Column("card_type", sa.String(length=40), nullable=True))
        batch.add_column(sa.Column("ip_address", sa.String(length=64), nullable=True))
        batch.add_column(sa.Column("device_id", sa.String(length=120), nullable=True))
        batch.add_column(sa.Column("confidence", sa.Float(), nullable=True))

    op.create_table(
        "user_session",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("device_label", sa.String(length=200), nullable=False),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("last_seen", sa.DateTime(), nullable=False),
        sa.Column("is_current", sa.Boolean(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "password_reset_token",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=120), nullable=False),
        sa.Column("otp_code", sa.String(length=10), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "fraud_notification",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("transaction_id", sa.Integer(), nullable=True),
        sa.Column("read", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.ForeignKeyConstraint(["transaction_id"], ["transaction.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "fraud_rule",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("(datetime('now'))")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.execute(
        """
        INSERT INTO fraud_rule (name, description, enabled, priority, updated_at)
        VALUES
        ('velocity_window', 'Flags burst transactions within 10 minutes', 1, 10, datetime('now')),
        ('high_amount', 'Flags amounts above configured threshold', 1, 20, datetime('now')),
        ('location_mismatch', 'Flags location change vs recent activity', 1, 30, datetime('now')),
        ('behavior_deviation', 'Compares spend vs user profile average', 1, 40, datetime('now'))
        """
    )


def downgrade():
    op.drop_table("fraud_rule")
    op.drop_table("fraud_notification")
    op.drop_table("password_reset_token")
    op.drop_table("user_session")
    with op.batch_alter_table("transaction") as batch:
        batch.drop_column("confidence")
        batch.drop_column("device_id")
        batch.drop_column("ip_address")
        batch.drop_column("card_type")
        batch.drop_column("merchant_category")
        batch.drop_column("country")
    with op.batch_alter_table("user") as batch:
        batch.drop_column("two_factor_enabled")
        batch.drop_column("email_verified")
        batch.drop_column("is_active")
        batch.drop_column("full_name")

"""add phone, ktp_image_url, and status to users

Revision ID: e7f8a9b0c1d2
Revises: 9f2d1b3c4a5e
Create Date: 2026-08-12 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'e7f8a9b0c1d2'
down_revision = 'd8f4a2c1e5b7'
branch_labels = None
depends_on = None


def upgrade():
    user_status_enum = sa.Enum('pending', 'approved', 'rejected', name='user_status_enum')
    user_status_enum.create(op.get_bind(), checkfirst=True)

    op.add_column('users', sa.Column('phone', sa.String(length=20), nullable=True))
    op.add_column('users', sa.Column('ktp_image_url', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('status', user_status_enum, nullable=False, server_default='approved'))
    op.create_index('ix_users_status', 'users', ['status'], unique=False)

    # Ensure all existing users have 'approved' status
    op.execute("UPDATE users SET status = 'approved' WHERE status IS NULL OR status = 'pending'")


def downgrade():
    op.drop_index('ix_users_status', table_name='users')
    op.drop_column('users', 'status')
    op.drop_column('users', 'ktp_image_url')
    op.drop_column('users', 'phone')

    user_status_enum = sa.Enum('pending', 'approved', 'rejected', name='user_status_enum')
    user_status_enum.drop(op.get_bind(), checkfirst=True)

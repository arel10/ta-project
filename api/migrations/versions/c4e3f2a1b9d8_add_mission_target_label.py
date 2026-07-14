"""add mission target_label column

Revision ID: c4e3f2a1b9d8
Revises: 9f2d1b3c4a5e
Create Date: 2026-06-25 10:34:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c4e3f2a1b9d8'
down_revision = 'b7c2e9f4a1b0'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('missions',
        sa.Column('target_label', sa.String(length=20), nullable=True, server_default=None)
    )


def downgrade():
    op.drop_column('missions', 'target_label')

"""add mission waste type

Revision ID: b7c2e9f4a1b0
Revises: 9f2d1b3c4a5e
Create Date: 2026-05-10 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b7c2e9f4a1b0'
down_revision = '9f2d1b3c4a5e'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('missions', sa.Column('waste_type_code', sa.String(length=10), nullable=True))
    op.create_index('ix_missions_waste_type_code', 'missions', ['waste_type_code'], unique=False)
    op.create_foreign_key(
        'fk_missions_waste_type_code',
        'missions',
        'waste_point_rates',
        ['waste_type_code'],
        ['code'],
    )


def downgrade():
    op.drop_constraint('fk_missions_waste_type_code', 'missions', type_='foreignkey')
    op.drop_index('ix_missions_waste_type_code', table_name='missions')
    op.drop_column('missions', 'waste_type_code')

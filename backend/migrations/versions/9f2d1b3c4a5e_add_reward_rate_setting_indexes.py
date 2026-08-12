"""add reward, rate, and setting indexes

Revision ID: 9f2d1b3c4a5e
Revises: 40c88d4e4407
Create Date: 2026-05-01 00:00:00.000000

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '9f2d1b3c4a5e'
down_revision = '40c88d4e4407'
branch_labels = None
depends_on = None


def upgrade():
    op.create_index('ix_rewards_is_active_points_cost', 'rewards', ['is_active', 'points_cost'], unique=False)
    op.create_index('ix_rewards_created_at', 'rewards', ['created_at'], unique=False)
    op.create_index('ix_waste_point_rates_active_sort', 'waste_point_rates', ['is_active', 'sort_order'], unique=False)
    op.create_index('ix_waste_point_rates_category', 'waste_point_rates', ['category'], unique=False)
    op.create_index('ix_point_settings_sort_order', 'point_settings', ['sort_order'], unique=False)


def downgrade():
    op.drop_index('ix_point_settings_sort_order', table_name='point_settings')
    op.drop_index('ix_waste_point_rates_category', table_name='waste_point_rates')
    op.drop_index('ix_waste_point_rates_active_sort', table_name='waste_point_rates')
    op.drop_index('ix_rewards_created_at', table_name='rewards')
    op.drop_index('ix_rewards_is_active_points_cost', table_name='rewards')

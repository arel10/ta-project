"""replace risk_level with churn prediction fields

Revision ID: d8f4a2c1e5b7
Revises: c4e3f2a1b9d8
Create Date: 2026-07-23 04:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd8f4a2c1e5b7'
down_revision = 'ad000d27bcfa'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('participation_risk', schema=None) as batch_op:
        # Add new churn prediction columns
        batch_op.add_column(sa.Column('avg_interval', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('std_interval', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('avg_berat', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('trend_berat', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('days_active', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('churn_probability', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('will_churn', sa.Boolean(), nullable=True))

        # Drop old risk_level column and its index
        batch_op.drop_index('ix_participation_risk_risk_level')
        batch_op.drop_column('risk_level')

        # Create new index for will_churn
        batch_op.create_index('ix_participation_risk_will_churn', ['will_churn'], unique=False)


def downgrade():
    with op.batch_alter_table('participation_risk', schema=None) as batch_op:
        # Drop new columns and index
        batch_op.drop_index('ix_participation_risk_will_churn')
        batch_op.drop_column('will_churn')
        batch_op.drop_column('churn_probability')
        batch_op.drop_column('days_active')
        batch_op.drop_column('trend_berat')
        batch_op.drop_column('avg_berat')
        batch_op.drop_column('std_interval')
        batch_op.drop_column('avg_interval')

        # Restore old risk_level column
        batch_op.add_column(sa.Column('risk_level', sa.String(length=10), nullable=True))
        batch_op.create_index('ix_participation_risk_risk_level', ['risk_level'], unique=False)

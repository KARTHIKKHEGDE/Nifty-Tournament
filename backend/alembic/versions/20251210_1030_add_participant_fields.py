"""add participant fields for tournament trading

Revision ID: add_participant_fields
Revises: add_tournament_trading
Create Date: 2025-12-10 10:30:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_participant_fields'
down_revision = 'add_tournament_trading'
branch_labels = None
depends_on = None


def upgrade():
    # Add new fields to tournament_participants
    op.add_column('tournament_participants', sa.Column('initial_balance', sa.Float(), nullable=True))
    op.add_column('tournament_participants', sa.Column('pnl', sa.Float(), server_default='0.0', nullable=False))
    op.add_column('tournament_participants', sa.Column('rank', sa.Integer(), nullable=True))
    op.add_column('tournament_participants', sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False))
    
    # Populate initial_balance from starting_balance for existing records
    op.execute('UPDATE tournament_participants SET initial_balance = starting_balance WHERE initial_balance IS NULL')
    
    # Make initial_balance non-nullable after populating
    op.alter_column('tournament_participants', 'initial_balance', nullable=False)


def downgrade():
    # Remove added fields
    op.drop_column('tournament_participants', 'is_active')
    op.drop_column('tournament_participants', 'rank')
    op.drop_column('tournament_participants', 'pnl')
    op.drop_column('tournament_participants', 'initial_balance')

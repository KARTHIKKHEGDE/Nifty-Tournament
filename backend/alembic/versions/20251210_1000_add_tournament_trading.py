"""add tournament_id to paper orders and positions

Revision ID: add_tournament_trading
Revises: add_team_tournaments
Create Date: 2025-12-10 10:00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_tournament_trading'
down_revision = 'add_team_tournaments'
branch_labels = None
depends_on = None


def upgrade():
    # Add tournament_id to paper_orders
    op.add_column('paper_orders', sa.Column('tournament_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_paper_orders_tournament_id',
        'paper_orders', 'tournaments',
        ['tournament_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_index('ix_paper_orders_tournament_id', 'paper_orders', ['tournament_id'])
    
    # Add additional tracking fields to paper_orders
    op.add_column('paper_orders', sa.Column('average_price', sa.Float(), nullable=True))
    op.add_column('paper_orders', sa.Column('filled_quantity', sa.Integer(), server_default='0', nullable=False))
    op.add_column('paper_orders', sa.Column('realized_pnl', sa.Float(), server_default='0.0', nullable=True))
    
    # Add tournament_id to paper_positions
    op.add_column('paper_positions', sa.Column('tournament_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_paper_positions_tournament_id',
        'paper_positions', 'tournaments',
        ['tournament_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_index('ix_paper_positions_tournament_id', 'paper_positions', ['tournament_id'])


def downgrade():
    # Remove from paper_positions
    op.drop_index('ix_paper_positions_tournament_id', 'paper_positions')
    op.drop_constraint('fk_paper_positions_tournament_id', 'paper_positions', type_='foreignkey')
    op.drop_column('paper_positions', 'tournament_id')
    
    # Remove additional fields from paper_orders
    op.drop_column('paper_orders', 'realized_pnl')
    op.drop_column('paper_orders', 'filled_quantity')
    op.drop_column('paper_orders', 'average_price')
    
    # Remove from paper_orders
    op.drop_index('ix_paper_orders_tournament_id', 'paper_orders')
    op.drop_constraint('fk_paper_orders_tournament_id', 'paper_orders', type_='foreignkey')
    op.drop_column('paper_orders', 'tournament_id')

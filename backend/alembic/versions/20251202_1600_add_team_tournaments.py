"""add team tournament support

Revision ID: add_team_tournaments
Revises: f91e0ee05c5e
Create Date: 2025-12-02 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_team_tournaments'
down_revision = 'f91e0ee05c5e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add tournament_type and team_size to tournaments table
    op.add_column('tournaments', sa.Column('tournament_type', sa.Enum('SOLO', 'TEAM', name='tournamenttype'), nullable=False, server_default='SOLO'))
    op.add_column('tournaments', sa.Column('team_size', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_tournaments_tournament_type'), 'tournaments', ['tournament_type'], unique=False)
    
    # Create teams table
    op.create_table(
        'teams',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tournament_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('captain_id', sa.Integer(), nullable=False),
        sa.Column('is_full', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('total_members', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['captain_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tournament_id'], ['tournaments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_teams_id'), 'teams', ['id'], unique=False)
    op.create_index(op.f('ix_teams_tournament_id'), 'teams', ['tournament_id'], unique=False)
    op.create_index(op.f('ix_teams_captain_id'), 'teams', ['captain_id'], unique=False)
    
    # Create team_members table
    op.create_table(
        'team_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('team_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.Enum('CAPTAIN', 'MEMBER', name='memberrole'), nullable=False, server_default='MEMBER'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('team_id', 'user_id', name='unique_team_user')
    )
    op.create_index(op.f('ix_team_members_id'), 'team_members', ['id'], unique=False)
    op.create_index(op.f('ix_team_members_team_id'), 'team_members', ['team_id'], unique=False)
    op.create_index(op.f('ix_team_members_user_id'), 'team_members', ['user_id'], unique=False)
    
    # Modify tournament_participants to support team participation
    # Make user_id nullable and add team_id
    op.alter_column('tournament_participants', 'user_id', nullable=True)
    op.add_column('tournament_participants', sa.Column('team_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_tournament_participants_team_id', 'tournament_participants', 'teams', ['team_id'], ['id'], ondelete='CASCADE')
    op.create_index(op.f('ix_tournament_participants_team_id'), 'tournament_participants', ['team_id'], unique=False)


def downgrade() -> None:
    # Drop team_id from tournament_participants
    op.drop_index(op.f('ix_tournament_participants_team_id'), table_name='tournament_participants')
    op.drop_constraint('fk_tournament_participants_team_id', 'tournament_participants', type_='foreignkey')
    op.drop_column('tournament_participants', 'team_id')
    op.alter_column('tournament_participants', 'user_id', nullable=False)
    
    # Drop team_members table
    op.drop_index(op.f('ix_team_members_user_id'), table_name='team_members')
    op.drop_index(op.f('ix_team_members_team_id'), table_name='team_members')
    op.drop_index(op.f('ix_team_members_id'), table_name='team_members')
    op.drop_table('team_members')
    
    # Drop teams table
    op.drop_index(op.f('ix_teams_captain_id'), table_name='teams')
    op.drop_index(op.f('ix_teams_tournament_id'), table_name='teams')
    op.drop_index(op.f('ix_teams_id'), table_name='teams')
    op.drop_table('teams')
    
    # Remove tournament_type and team_size from tournaments
    op.drop_index(op.f('ix_tournaments_tournament_type'), table_name='tournaments')
    op.drop_column('tournaments', 'team_size')
    op.drop_column('tournaments', 'tournament_type')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS memberrole')
    op.execute('DROP TYPE IF EXISTS tournamenttype')

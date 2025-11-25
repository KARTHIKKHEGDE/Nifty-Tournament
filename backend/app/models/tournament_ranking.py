"""
Tournament Ranking model for real-time leaderboard.
"""

from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base


class TournamentRanking(Base):
    """
    Tournament Ranking model for real-time leaderboard.
    Rankings are updated in real-time as trades are executed.
    
    Attributes:
        id: Primary key
        tournament_id: Foreign key to Tournament
        user_id: Foreign key to User
        rank: Current rank in tournament
        total_pnl: Total profit/loss
        roi: Return on Investment percentage
        total_trades: Number of trades
        win_rate: Win rate percentage
        current_balance: Current virtual balance
        last_updated: Last update timestamp
    
    Relationships:
        tournament: The tournament (many-to-one)
        user: The user (many-to-one)
    """
    
    __tablename__ = "tournament_rankings"
    __table_args__ = (
        UniqueConstraint('tournament_id', 'user_id', name='unique_tournament_ranking'),
        Index('idx_tournament_rank', 'tournament_id', 'rank'),
        Index('idx_tournament_pnl', 'tournament_id', 'total_pnl'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Ranking data
    rank = Column(Integer, nullable=False, index=True)
    total_pnl = Column(Float, default=0.0, nullable=False)
    roi = Column(Float, default=0.0, nullable=False)  # Return on Investment %
    total_trades = Column(Integer, default=0, nullable=False)
    win_rate = Column(Float, default=0.0, nullable=False)  # Win rate %
    current_balance = Column(Float, nullable=False)
    
    # Timestamp
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    tournament = relationship("Tournament", back_populates="rankings")
    user = relationship("User")
    
    def __repr__(self):
        return f"<TournamentRanking(tournament_id={self.tournament_id}, user_id={self.user_id}, rank={self.rank}, pnl={self.total_pnl})>"

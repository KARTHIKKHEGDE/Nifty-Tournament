"""
Tournament Participant model for tracking user participation in tournaments.
"""

from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base


class TournamentParticipant(Base):
    """
    Tournament Participant model for tracking user participation.
    
    Attributes:
        id: Primary key
        tournament_id: Foreign key to Tournament
        user_id: Foreign key to User
        entry_fee_paid: Whether entry fee was paid
        starting_balance: Virtual balance at tournament start
        current_balance: Current virtual balance
        total_pnl: Total profit/loss
        total_trades: Number of trades executed
        winning_trades: Number of profitable trades
        losing_trades: Number of losing trades
        joined_at: When user joined the tournament
        last_trade_at: Timestamp of last trade
    
    Relationships:
        tournament: The tournament (many-to-one)
        user: The participating user (many-to-one)
    """
    
    __tablename__ = "tournament_participants"
    __table_args__ = (
        UniqueConstraint('tournament_id', 'user_id', name='unique_tournament_user'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)  # Null for team participants
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=True, index=True)  # Null for solo participants
    
    # Payment
    entry_fee_paid = Column(Boolean, default=False, nullable=False)
    
    # Trading stats
    starting_balance = Column(Float, nullable=False)
    current_balance = Column(Float, nullable=False)
    total_pnl = Column(Float, default=0.0, nullable=False)
    
    # Trade statistics
    total_trades = Column(Integer, default=0, nullable=False)
    winning_trades = Column(Integer, default=0, nullable=False)
    losing_trades = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_trade_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    tournament = relationship("Tournament", back_populates="participants")
    user = relationship("User", back_populates="tournament_participants", foreign_keys=[user_id])
    team = relationship("Team", foreign_keys=[team_id])
    
    def __repr__(self):
        return f"<TournamentParticipant(tournament_id={self.tournament_id}, user_id={self.user_id}, pnl={self.total_pnl})>"
    
    @property
    def roi(self) -> float:
        """Calculate Return on Investment (ROI) percentage."""
        if self.starting_balance == 0:
            return 0.0
        return (self.total_pnl / self.starting_balance) * 100
    
    @property
    def win_rate(self) -> float:
        """Calculate win rate percentage."""
        if self.total_trades == 0:
            return 0.0
        return (self.winning_trades / self.total_trades) * 100
    
    @property
    def balance_change(self) -> float:
        """Calculate balance change from start."""
        return self.current_balance - self.starting_balance
    
    def update_stats(self, trade_pnl: float):
        """
        Update participant statistics after a trade.
        
        Args:
            trade_pnl: Profit/loss from the trade
        """
        self.total_trades += 1
        self.total_pnl += trade_pnl
        self.current_balance += trade_pnl
        
        if trade_pnl > 0:
            self.winning_trades += 1
        elif trade_pnl < 0:
            self.losing_trades += 1
        
        self.last_trade_at = func.now()

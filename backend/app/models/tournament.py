"""
Tournament model for managing trading competitions.
"""

from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base
import enum


class TournamentStatus(str, enum.Enum):
    """Tournament status."""
    UPCOMING = "UPCOMING"
    REGISTRATION_OPEN = "REGISTRATION_OPEN"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class TournamentType(str, enum.Enum):
    """Tournament type."""
    SOLO = "SOLO"
    TEAM = "TEAM"


class Tournament(Base):
    """
    Tournament model for trading competitions.
    Users compete with paper trading to win REAL MONEY prizes!
    
    Attributes:
        id: Primary key
        name: Tournament name
        description: Tournament description
        status: Current tournament status
        entry_fee: Entry fee (optional, 0 for free tournaments)
        prize_pool: Total prize pool in INR (REAL MONEY)
        starting_balance: Virtual balance each participant starts with
        max_participants: Maximum number of participants (null for unlimited)
        current_participants: Current number of registered participants
        start_date: Tournament start date/time
        end_date: Tournament end date/time
        registration_deadline: Last date to register
        rules: Tournament rules and conditions (JSON or text)
        created_at: When tournament was created
        updated_at: Last update timestamp
    
    Relationships:
        participants: Users participating in this tournament (one-to-many)
        rankings: Tournament rankings (one-to-many)
        prize_distributions: Prize distribution records (one-to-many)
    """
    
    __tablename__ = "tournaments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(TournamentStatus), default=TournamentStatus.UPCOMING, nullable=False, index=True)
    tournament_type = Column(SQLEnum(TournamentType), default=TournamentType.SOLO, nullable=False, index=True)
    team_size = Column(Integer, nullable=True)  # Required for TEAM tournaments, null for SOLO
    
    # Financial details
    entry_fee = Column(Float, default=0.0, nullable=False)
    prize_pool = Column(Float, nullable=False)  # REAL MONEY prize pool
    starting_balance = Column(Float, default=100000.0, nullable=False)  # Virtual trading balance
    
    # Participation limits
    max_participants = Column(Integer, nullable=True)  # null = unlimited
    current_participants = Column(Integer, default=0, nullable=False)
    
    # Dates
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    registration_deadline = Column(DateTime(timezone=True), nullable=False)
    
    # Rules and settings
    rules = Column(Text, nullable=True)  # Can store JSON
    
    # Metadata
    created_by = Column(Integer, nullable=True)  # Admin user ID
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    participants = relationship("TournamentParticipant", back_populates="tournament", cascade="all, delete-orphan")
    rankings = relationship("TournamentRanking", back_populates="tournament", cascade="all, delete-orphan")
    prize_distributions = relationship("PrizeDistribution", back_populates="tournament", cascade="all, delete-orphan")
    teams = relationship("Team", back_populates="tournament", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Tournament(id={self.id}, name={self.name}, status={self.status}, prize_pool=₹{self.prize_pool})>"
    
    @property
    def is_registration_open(self) -> bool:
        """Check if registration is still open."""
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        return (
            self.status == TournamentStatus.REGISTRATION_OPEN and
            now < self.registration_deadline and
            (self.max_participants is None or self.current_participants < self.max_participants)
        )
    
    @property
    def is_active(self) -> bool:
        """Check if tournament is currently active."""
        return self.status == TournamentStatus.ACTIVE
    
    @property
    def is_full(self) -> bool:
        """Check if tournament has reached max participants."""
        if self.max_participants is None:
            return False
        return self.current_participants >= self.max_participants
    
    @property
    def spots_remaining(self) -> int:
        """Get number of remaining spots."""
        if self.max_participants is None:
            return -1  # Unlimited
        return max(0, self.max_participants - self.current_participants)

"""
User model for authentication and user management.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base


class User(Base):
    """
    User model for storing user account information.
    
    Attributes:
        id: Primary key
        email: Unique email address for login
        username: Unique username for display
        password_hash: Hashed password (never store plain text)
        is_active: Whether the user account is active
        is_admin: Whether the user has admin privileges
        created_at: Timestamp when user was created
        updated_at: Timestamp when user was last updated
    
    Relationships:
        wallet: User's virtual wallet (one-to-one)
        paper_orders: User's paper trading orders (one-to-many)
        paper_positions: User's current paper trading positions (one-to-many)
        tournament_participants: Tournaments the user has joined (one-to-many)
        settings: User's preferences and settings (one-to-one)
    """
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    wallet = relationship("Wallet", back_populates="user", uselist=False, cascade="all, delete-orphan")
    paper_orders = relationship("PaperOrder", back_populates="user", cascade="all, delete-orphan")
    paper_positions = relationship("PaperPosition", back_populates="user", cascade="all, delete-orphan")
    tournament_participants = relationship("TournamentParticipant", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"

"""
Wallet model for managing user's virtual trading balance.
"""

from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base


class Wallet(Base):
    """
    Wallet model for storing user's virtual trading balance.
    This is for PAPER TRADING ONLY - no real money involved.
    
    Attributes:
        id: Primary key
        user_id: Foreign key to User
        balance: Current virtual balance (in INR)
        currency: Currency code (default: INR)
        total_deposits: Total virtual deposits (for tracking)
        total_withdrawals: Total virtual withdrawals (for tracking)
        created_at: Timestamp when wallet was created
        updated_at: Timestamp when wallet was last updated
    
    Relationships:
        user: The user who owns this wallet (many-to-one)
    """
    
    __tablename__ = "wallets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    balance = Column(Float, default=0.0, nullable=False)
    currency = Column(String, default="INR", nullable=False)
    total_deposits = Column(Float, default=0.0, nullable=False)
    total_withdrawals = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="wallet")
    
    def __repr__(self):
        return f"<Wallet(id={self.id}, user_id={self.user_id}, balance={self.balance} {self.currency})>"
    
    def can_afford(self, amount: float) -> bool:
        """Check if wallet has sufficient balance for a transaction."""
        return self.balance >= amount
    
    def deduct(self, amount: float) -> bool:
        """
        Deduct amount from wallet balance.
        Returns True if successful, False if insufficient balance.
        """
        if self.can_afford(amount):
            self.balance -= amount
            return True
        return False
    
    def add(self, amount: float):
        """Add amount to wallet balance."""
        self.balance += amount

"""
Prize Distribution model for tracking real money prize payments.
"""

from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Boolean, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base
import enum


class PaymentStatus(str, enum.Enum):
    """Payment status for prize distribution."""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class PaymentMethod(str, enum.Enum):
    """Payment method for prize distribution."""
    UPI = "UPI"
    BANK_TRANSFER = "BANK_TRANSFER"
    WALLET = "WALLET"
    OTHER = "OTHER"


class PrizeDistribution(Base):
    """
    Prize Distribution model for tracking REAL MONEY prize payments.
    This tracks the distribution of real money prizes to tournament winners.
    
    Attributes:
        id: Primary key
        tournament_id: Foreign key to Tournament
        user_id: Foreign key to User (winner)
        rank: Final rank in tournament
        prize_amount: Prize amount in INR (REAL MONEY)
        payment_status: Current payment status
        payment_method: Method of payment
        payment_reference: Payment reference/transaction ID
        payment_details: Additional payment details (UPI ID, bank account, etc.)
        paid_at: When payment was completed
        created_at: When prize record was created
        updated_at: Last update timestamp
        notes: Additional notes
    
    Relationships:
        tournament: The tournament (many-to-one)
        user: The winner (many-to-one)
    """
    
    __tablename__ = "prize_distributions"
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Prize details
    rank = Column(Integer, nullable=False)
    prize_amount = Column(Float, nullable=False)  # REAL MONEY in INR
    
    # Payment details
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=True)
    payment_reference = Column(String, nullable=True)  # Transaction ID
    payment_details = Column(Text, nullable=True)  # UPI ID, bank account, etc. (encrypted in production)
    
    # Timestamps
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Additional info
    notes = Column(Text, nullable=True)
    
    # Relationships
    tournament = relationship("Tournament", back_populates="prize_distributions")
    user = relationship("User")
    
    def __repr__(self):
        return f"<PrizeDistribution(tournament_id={self.tournament_id}, user_id={self.user_id}, rank={self.rank}, amount=₹{self.prize_amount}, status={self.payment_status})>"
    
    @property
    def is_paid(self) -> bool:
        """Check if prize has been paid."""
        return self.payment_status == PaymentStatus.COMPLETED
    
    @property
    def is_pending(self) -> bool:
        """Check if payment is pending."""
        return self.payment_status == PaymentStatus.PENDING
    
    def mark_as_paid(self, payment_reference: str, payment_method: PaymentMethod):
        """Mark prize as paid."""
        self.payment_status = PaymentStatus.COMPLETED
        self.payment_reference = payment_reference
        self.payment_method = payment_method
        self.paid_at = func.now()

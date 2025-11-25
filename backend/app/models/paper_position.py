"""
Paper Position model for tracking open positions in paper trading.
"""

from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base
from app.models.paper_order import InstrumentType, OrderSide


class PaperPosition(Base):
    """
    Paper Position model for tracking open positions.
    Positions are created when orders are executed and represent current holdings.
    
    Attributes:
        id: Primary key
        user_id: Foreign key to User
        symbol: Trading symbol
        instrument_type: Type of instrument
        quantity: Current position quantity (positive for long, negative for short)
        average_price: Average entry price
        current_price: Current market price (updated in real-time)
        unrealized_pnl: Unrealized profit/loss
        realized_pnl: Realized profit/loss (from closed portions)
        stop_loss: Stop loss price
        take_profit: Take profit price
        created_at: When position was opened
        updated_at: Last update timestamp
    
    Relationships:
        user: The user who owns this position (many-to-one)
    """
    
    __tablename__ = "paper_positions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Instrument details
    symbol = Column(String, nullable=False, index=True)
    instrument_type = Column(SQLEnum(InstrumentType), nullable=False)
    instrument_token = Column(Integer, nullable=True)
    
    # Position details
    quantity = Column(Integer, nullable=False)  # Positive for long, negative for short
    average_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=True)
    
    # P&L tracking
    unrealized_pnl = Column(Float, default=0.0, nullable=False)
    realized_pnl = Column(Float, default=0.0, nullable=False)
    
    # Risk management
    stop_loss = Column(Float, nullable=True)
    take_profit = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="paper_positions")
    
    def __repr__(self):
        return f"<PaperPosition(id={self.id}, symbol={self.symbol}, qty={self.quantity}, avg_price={self.average_price})>"
    
    @property
    def position_value(self) -> float:
        """Calculate current position value."""
        if self.current_price:
            return abs(self.quantity) * self.current_price
        return abs(self.quantity) * self.average_price
    
    @property
    def is_long(self) -> bool:
        """Check if this is a long position."""
        return self.quantity > 0
    
    @property
    def is_short(self) -> bool:
        """Check if this is a short position."""
        return self.quantity < 0
    
    def calculate_unrealized_pnl(self) -> float:
        """
        Calculate unrealized P&L based on current price.
        Returns positive value for profit, negative for loss.
        """
        if not self.current_price:
            return 0.0
        
        if self.is_long:
            return (self.current_price - self.average_price) * self.quantity
        else:
            return (self.average_price - self.current_price) * abs(self.quantity)
    
    def update_current_price(self, new_price: float):
        """Update current price and recalculate unrealized P&L."""
        self.current_price = new_price
        self.unrealized_pnl = self.calculate_unrealized_pnl()
    
    @property
    def total_pnl(self) -> float:
        """Calculate total P&L (realized + unrealized)."""
        return self.realized_pnl + self.unrealized_pnl
    
    @property
    def pnl_percentage(self) -> float:
        """Calculate P&L as percentage of investment."""
        investment = abs(self.quantity) * self.average_price
        if investment == 0:
            return 0.0
        return (self.total_pnl / investment) * 100

"""
Paper Order model for simulated trading orders.
"""

from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base
import enum


class OrderType(str, enum.Enum):
    """Order types supported in paper trading."""
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOP_LOSS = "STOP_LOSS"
    STOP_LOSS_MARKET = "STOP_LOSS_MARKET"


class OrderSide(str, enum.Enum):
    """Order side (buy or sell)."""
    BUY = "BUY"
    SELL = "SELL"


class OrderStatus(str, enum.Enum):
    """Order execution status."""
    PENDING = "PENDING"
    OPEN = "OPEN"
    EXECUTED = "EXECUTED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"


class InstrumentType(str, enum.Enum):
    """Type of instrument being traded."""
    INDEX = "INDEX"  # NIFTY, BANKNIFTY
    OPTION_CE = "OPTION_CE"  # Call options
    OPTION_PE = "OPTION_PE"  # Put options


class PaperOrder(Base):
    """
    Paper Order model for simulated trading orders.
    All orders are virtual - NO real money or actual orders are placed.
    
    Attributes:
        id: Primary key
        user_id: Foreign key to User
        symbol: Trading symbol (e.g., "NIFTY 50", "NIFTY24JAN19500CE")
        instrument_type: Type of instrument (INDEX, OPTION_CE, OPTION_PE)
        order_type: Type of order (MARKET, LIMIT, STOP_LOSS)
        order_side: Buy or Sell
        quantity: Number of units
        price: Order price (for LIMIT orders)
        trigger_price: Trigger price (for STOP_LOSS orders)
        executed_price: Actual execution price
        executed_quantity: Quantity that was executed
        status: Current order status
        stop_loss: Stop loss price (optional)
        take_profit: Take profit price (optional)
        created_at: Timestamp when order was created
        executed_at: Timestamp when order was executed
        updated_at: Timestamp when order was last updated
    
    Relationships:
        user: The user who placed this order (many-to-one)
    """
    
    __tablename__ = "paper_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Instrument details
    symbol = Column(String, nullable=False, index=True)
    instrument_type = Column(SQLEnum(InstrumentType), nullable=False)
    instrument_token = Column(Integer, nullable=True)  # Market data instrument token
    
    # Order details
    order_type = Column(SQLEnum(OrderType), nullable=False)
    order_side = Column(SQLEnum(OrderSide), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=True)  # For LIMIT orders
    trigger_price = Column(Float, nullable=True)  # For STOP_LOSS orders
    
    # Execution details
    executed_price = Column(Float, nullable=True)
    executed_quantity = Column(Integer, default=0, nullable=False)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    
    # Risk management
    stop_loss = Column(Float, nullable=True)
    take_profit = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    executed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="paper_orders")
    
    def __repr__(self):
        return f"<PaperOrder(id={self.id}, symbol={self.symbol}, side={self.order_side}, qty={self.quantity}, status={self.status})>"
    
    @property
    def total_value(self) -> float:
        """Calculate total order value."""
        if self.executed_price and self.executed_quantity:
            return self.executed_price * self.executed_quantity
        elif self.price:
            return self.price * self.quantity
        return 0.0
    
    @property
    def is_filled(self) -> bool:
        """Check if order is fully filled."""
        return self.status == OrderStatus.EXECUTED
    
    @property
    def is_active(self) -> bool:
        """Check if order is still active."""
        return self.status in [OrderStatus.PENDING, OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]

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
    """
    
    __tablename__ = "paper_positions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Instrument details
    tradingsymbol = Column(String, nullable=False, index=True)  # Full trading symbol (e.g., NIFTY24NOV24000CE)
    symbol = Column(String, nullable=False, index=True)  # Display name
    exchange = Column(String, default="NFO", nullable=False)  # NSE, NFO, BSE
    product = Column(String, default="MIS", nullable=False)  # MIS, CNC, NRML
    instrument_type = Column(SQLEnum(InstrumentType), nullable=False)
    instrument_token = Column(Integer, nullable=True)
    
    # Position details
    quantity = Column(Integer, nullable=False)  # Net quantity (buy_qty - sell_qty)
    buy_qty = Column(Integer, default=0, nullable=False)  # Total buy quantity
    sell_qty = Column(Integer, default=0, nullable=False)  # Total sell quantity
    average_price = Column(Float, nullable=False)  # Weighted average entry price
    ltp = Column(Float, nullable=True)  # Last traded price (current market price)
    current_price = Column(Float, nullable=True)  # Alias for ltp
    
    # P&L tracking
    pnl = Column(Float, default=0.0, nullable=False)  # Total P&L
    unrealized_pnl = Column(Float, default=0.0, nullable=False)  # Unrealized P&L
    realized_pnl = Column(Float, default=0.0, nullable=False)  # Realized P&L
    
    # Market data
    day_change = Column(Float, nullable=True)  # LTP change vs yesterday close
    day_change_percentage = Column(Float, nullable=True)  # % change
    
    # F&O specific
    multiplier = Column(Integer, default=1, nullable=False)  # Lot size (75 for NIFTY, 1 for equity)
    var_margin = Column(Float, nullable=True)  # Margin required for F&O
    
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
        price = self.ltp or self.current_price or self.average_price
        return abs(self.quantity) * price * self.multiplier
    
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
        Calculate unrealized P&L.
        
        For Equity: P&L = (LTP - AvgPrice) × Quantity
        For Options/Futures: P&L = (LTP - AvgPrice) × Multiplier × sign(Quantity)
        
        Returns positive value for profit, negative for loss.
        """
        price = self.ltp or self.current_price
        if not price:
            return 0.0
        
        # For Options (CE/PE) and Futures
        if self.instrument_type in [InstrumentType.CE, InstrumentType.PE]:
            # P&L = (LTP - AvgPrice) × LotSize
            pnl_per_lot = (price - self.average_price) * self.multiplier
            # Multiply by sign of quantity (positive for long, negative for short)
            return pnl_per_lot * (1 if self.quantity > 0 else -1)
        
        # For Equity (INDEX)
        # P&L = (LTP - AvgPrice) × Quantity
        return (price - self.average_price) * self.quantity
    
    def update_current_price(self, new_price: float, yesterday_close: float = None):
        """
        Update current price and recalculate P&L.
        
        Args:
            new_price: New LTP
            yesterday_close: Yesterday's closing price for day_change calculation
        """
        self.ltp = new_price
        self.current_price = new_price
        self.unrealized_pnl = self.calculate_unrealized_pnl()
        self.pnl = self.realized_pnl + self.unrealized_pnl
        
        # Calculate day change if yesterday_close is provided
        if yesterday_close and yesterday_close > 0:
            self.day_change = new_price - yesterday_close
            self.day_change_percentage = ((new_price - yesterday_close) / yesterday_close) * 100
    
    @property
    def total_pnl(self) -> float:
        """Calculate total P&L (realized + unrealized)."""
        return self.realized_pnl + self.unrealized_pnl
    
    @property
    def pnl_percentage(self) -> float:
        """
        Calculate P&L as percentage of investment.
        P&L% = ((LTP - AvgPrice) / AvgPrice) × 100
        """
        if self.average_price == 0:
            return 0.0
        
        price = self.ltp or self.current_price or self.average_price
        return ((price - self.average_price) / self.average_price) * 100

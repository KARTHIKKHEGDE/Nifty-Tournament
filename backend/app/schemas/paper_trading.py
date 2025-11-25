"""
Paper trading schemas for orders and positions.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from app.models.paper_order import OrderType, OrderSide, OrderStatus, InstrumentType


class OrderCreate(BaseModel):
    """Schema for creating a paper trading order."""
    symbol: str = Field(..., min_length=1, max_length=100)
    instrument_type: InstrumentType
    order_type: OrderType
    order_side: OrderSide
    quantity: int = Field(..., gt=0)
    price: Optional[float] = Field(None, gt=0)  # Required for LIMIT orders
    trigger_price: Optional[float] = Field(None, gt=0)  # Required for STOP_LOSS orders
    stop_loss: Optional[float] = Field(None, gt=0)
    take_profit: Optional[float] = Field(None, gt=0)
    instrument_token: Optional[int] = None
    
    @validator('price')
    def validate_limit_price(cls, v, values):
        """Validate that LIMIT orders have a price."""
        if values.get('order_type') == OrderType.LIMIT and v is None:
            raise ValueError('Price is required for LIMIT orders')
        return v
    
    @validator('trigger_price')
    def validate_stop_loss_trigger(cls, v, values):
        """Validate that STOP_LOSS orders have a trigger price."""
        if values.get('order_type') in [OrderType.STOP_LOSS, OrderType.STOP_LOSS_MARKET] and v is None:
            raise ValueError('Trigger price is required for STOP_LOSS orders')
        return v


class OrderResponse(BaseModel):
    """Schema for order response."""
    id: int
    user_id: int
    symbol: str
    instrument_type: InstrumentType
    order_type: OrderType
    order_side: OrderSide
    quantity: int
    price: Optional[float]
    trigger_price: Optional[float]
    executed_price: Optional[float]
    executed_quantity: int
    status: OrderStatus
    stop_loss: Optional[float]
    take_profit: Optional[float]
    created_at: datetime
    executed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class OrderUpdate(BaseModel):
    """Schema for updating an order."""
    quantity: Optional[int] = Field(None, gt=0)
    price: Optional[float] = Field(None, gt=0)
    stop_loss: Optional[float] = Field(None, gt=0)
    take_profit: Optional[float] = Field(None, gt=0)


class PositionResponse(BaseModel):
    """Schema for position response."""
    id: int
    user_id: int
    symbol: str
    instrument_type: InstrumentType
    quantity: int
    average_price: float
    current_price: Optional[float]
    unrealized_pnl: float
    realized_pnl: float
    stop_loss: Optional[float]
    take_profit: Optional[float]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class WalletResponse(BaseModel):
    """Schema for wallet response."""
    id: int
    user_id: int
    balance: float
    currency: str
    total_deposits: float
    total_withdrawals: float
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PortfolioSummary(BaseModel):
    """Schema for portfolio summary."""
    total_balance: float
    available_balance: float
    invested_amount: float
    total_pnl: float
    total_pnl_percentage: float
    open_positions_count: int
    total_trades: int


class TradeHistory(BaseModel):
    """Schema for trade history entry."""
    order_id: int
    symbol: str
    order_side: OrderSide
    quantity: int
    executed_price: float
    total_value: float
    executed_at: datetime
    pnl: Optional[float] = None
    
    class Config:
        from_attributes = True

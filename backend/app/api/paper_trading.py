"""
Paper trading API routes.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db
from app.schemas.paper_trading import (
    OrderCreate, OrderResponse, PositionResponse,
    WalletResponse, PortfolioSummary
)
from app.services.paper_trading_engine import PaperTradingEngine
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.wallet import Wallet

router = APIRouter()


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def place_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Place a paper trading order.
    
    This is a SIMULATED order - no real money or actual orders are placed.
    The order is executed using live market prices from Zerodha.
    
    Args:
        order_data: Order details (symbol, type, side, quantity, etc.)
        
    Returns:
        Created order with execution details
    """
    try:
        engine = PaperTradingEngine(db)
        order = engine.place_order(current_user.id, order_data)
        return order
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/orders", response_model=List[OrderResponse])
async def get_orders(
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's order history.
    
    Returns:
        List of paper trading orders (most recent first)
    """
    engine = PaperTradingEngine(db)
    orders = engine.get_user_orders(current_user.id, limit)
    return orders


@router.delete("/orders/{order_id}")
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel a pending or open order.
    
    Args:
        order_id: Order ID to cancel
        
    Returns:
        Success message
    """
    engine = PaperTradingEngine(db)
    success = engine.cancel_order(order_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or cannot be cancelled"
        )
    
    return {"message": "Order cancelled successfully"}


@router.get("/positions", response_model=List[PositionResponse])
async def get_positions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's current positions.
    
    Returns:
        List of open positions with current P&L
    """
    engine = PaperTradingEngine(db)
    
    # Update prices before returning
    engine.update_positions_prices(current_user.id)
    
    positions = engine.get_user_positions(current_user.id)
    return positions


@router.get("/wallet", response_model=WalletResponse)
async def get_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's virtual wallet balance.
    
    Returns:
        Wallet details with available balance
    """
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found"
        )
    
    return wallet


@router.get("/portfolio", response_model=PortfolioSummary)
async def get_portfolio_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get portfolio summary with total balance, P&L, and statistics.
    
    Returns:
        Portfolio summary including:
        - Total balance (wallet + invested + unrealized P&L)
        - Available balance
        - Invested amount
        - Total P&L
        - Number of positions and trades
    """
    engine = PaperTradingEngine(db)
    summary = engine.get_portfolio_summary(current_user.id)
    return summary

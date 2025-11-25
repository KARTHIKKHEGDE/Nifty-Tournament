"""
Paper Trading Engine for simulating order execution.
This engine simulates order execution using live market prices from Zerodha.
NO REAL ORDERS ARE PLACED - this is for practice trading only.
"""

from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from app.models.paper_order import PaperOrder, OrderType, OrderSide, OrderStatus, InstrumentType
from app.models.paper_position import PaperPosition
from app.models.wallet import Wallet
from app.schemas.paper_trading import OrderCreate
from app.services.zerodha_service import get_zerodha_service
from app.utils.logger import setup_logger
from app.config import settings

logger = setup_logger(__name__)


class PaperTradingEngine:
    """
    Paper Trading Engine for simulating order execution.
    
    This engine:
    1. Validates orders against wallet balance
    2. Simulates order execution using live market prices
    3. Creates/updates positions
    4. Calculates P&L in real-time
    5. Updates wallet balance
    """
    
    def __init__(self, db: Session):
        """
        Initialize paper trading engine.
        
        Args:
            db: Database session
        """
        self.db = db
        self.zerodha = get_zerodha_service()
    
    def place_order(self, user_id: int, order_data: OrderCreate) -> PaperOrder:
        """
        Place a paper trading order.
        
        Args:
            user_id: User ID
            order_data: Order creation data
            
        Returns:
            Created PaperOrder instance
            
        Raises:
            ValueError: If order validation fails
        """
        # Get user wallet
        wallet = self.db.query(Wallet).filter(Wallet.user_id == user_id).first()
        if not wallet:
            raise ValueError("User wallet not found")
        
        # Get current market price
        current_price = self._get_market_price(order_data.symbol, order_data.instrument_type)
        if current_price is None:
            raise ValueError(f"Unable to fetch market price for {order_data.symbol}")
        
        # Calculate order value
        order_value = self._calculate_order_value(order_data, current_price)
        
        # Validate wallet balance for BUY orders
        if order_data.order_side == OrderSide.BUY:
            if not wallet.can_afford(order_value):
                raise ValueError(f"Insufficient balance. Required: ₹{order_value:.2f}, Available: ₹{wallet.balance:.2f}")
        
        # Check position limits
        if order_value > settings.MAX_POSITION_SIZE:
            raise ValueError(f"Order value exceeds maximum position size of ₹{settings.MAX_POSITION_SIZE}")
        
        # Create order
        order = PaperOrder(
            user_id=user_id,
            symbol=order_data.symbol,
            instrument_type=order_data.instrument_type,
            instrument_token=order_data.instrument_token,
            order_type=order_data.order_type,
            order_side=order_data.order_side,
            quantity=order_data.quantity,
            price=order_data.price,
            trigger_price=order_data.trigger_price,
            stop_loss=order_data.stop_loss,
            take_profit=order_data.take_profit,
            status=OrderStatus.PENDING
        )
        
        self.db.add(order)
        self.db.flush()
        
        # Execute order immediately for MARKET orders
        if order_data.order_type == OrderType.MARKET:
            self._execute_order(order, current_price)
        else:
            order.status = OrderStatus.OPEN
        
        self.db.commit()
        self.db.refresh(order)
        
        logger.info(f"Order placed: {order.id} - {order.symbol} {order.order_side} {order.quantity} @ {current_price}")
        return order
    
    def _execute_order(self, order: PaperOrder, execution_price: float):
        """
        Execute a paper order.
        
        Args:
            order: PaperOrder instance
            execution_price: Price at which to execute
        """
        order.executed_price = execution_price
        order.executed_quantity = order.quantity
        order.status = OrderStatus.EXECUTED
        order.executed_at = datetime.utcnow()
        
        # Update wallet
        wallet = self.db.query(Wallet).filter(Wallet.user_id == order.user_id).first()
        order_value = execution_price * order.quantity
        
        if order.order_side == OrderSide.BUY:
            wallet.deduct(order_value)
            logger.info(f"Deducted ₹{order_value:.2f} from wallet (Order {order.id})")
        else:  # SELL
            wallet.add(order_value)
            logger.info(f"Added ₹{order_value:.2f} to wallet (Order {order.id})")
        
        # Update or create position
        self._update_position(order)
        
        logger.info(f"Order executed: {order.id} @ ₹{execution_price}")
    
    def _update_position(self, order: PaperOrder):
        """
        Update or create position after order execution.
        
        Args:
            order: Executed PaperOrder
        """
        # Find existing position
        position = self.db.query(PaperPosition).filter(
            PaperPosition.user_id == order.user_id,
            PaperPosition.symbol == order.symbol
        ).first()
        
        if position is None:
            # Create new position
            position = PaperPosition(
                user_id=order.user_id,
                symbol=order.symbol,
                instrument_type=order.instrument_type,
                instrument_token=order.instrument_token,
                quantity=order.executed_quantity if order.order_side == OrderSide.BUY else -order.executed_quantity,
                average_price=order.executed_price,
                current_price=order.executed_price,
                stop_loss=order.stop_loss,
                take_profit=order.take_profit
            )
            self.db.add(position)
            logger.info(f"Created new position: {position.symbol} qty={position.quantity}")
        else:
            # Update existing position
            if order.order_side == OrderSide.BUY:
                # Adding to position
                total_cost = (position.quantity * position.average_price) + (order.executed_quantity * order.executed_price)
                position.quantity += order.executed_quantity
                position.average_price = total_cost / position.quantity if position.quantity != 0 else 0
            else:  # SELL
                # Reducing position
                if position.quantity >= order.executed_quantity:
                    # Calculate realized P&L
                    realized_pnl = (order.executed_price - position.average_price) * order.executed_quantity
                    position.realized_pnl += realized_pnl
                    position.quantity -= order.executed_quantity
                    
                    logger.info(f"Realized P&L: ₹{realized_pnl:.2f}")
                    
                    # Close position if quantity is zero
                    if position.quantity == 0:
                        self.db.delete(position)
                        logger.info(f"Position closed: {position.symbol}")
                        return
                else:
                    # Reversing position (going from long to short or vice versa)
                    position.quantity = -(order.executed_quantity - position.quantity)
                    position.average_price = order.executed_price
            
            # Update current price
            position.current_price = order.executed_price
            position.unrealized_pnl = position.calculate_unrealized_pnl()
            
            logger.info(f"Updated position: {position.symbol} qty={position.quantity} avg={position.average_price:.2f}")
    
    def _get_market_price(self, symbol: str, instrument_type: InstrumentType) -> Optional[float]:
        """
        Get current market price for a symbol.
        
        Args:
            symbol: Trading symbol
            instrument_type: Type of instrument
            
        Returns:
            Current market price or None
        """
        try:
            # For INDEX, use NSE
            if instrument_type == InstrumentType.INDEX:
                price = self.zerodha.get_current_price(f"NSE:{symbol}")
            else:
                # For options, use NFO
                price = self.zerodha.get_current_price(f"NFO:{symbol}")
            
            return price
        except Exception as e:
            logger.error(f"Failed to get market price for {symbol}: {e}")
            return None
    
    def _calculate_order_value(self, order_data: OrderCreate, current_price: float) -> float:
        """
        Calculate total order value.
        
        Args:
            order_data: Order data
            current_price: Current market price
            
        Returns:
            Total order value
        """
        if order_data.order_type == OrderType.LIMIT and order_data.price:
            return order_data.price * order_data.quantity
        else:
            return current_price * order_data.quantity
    
    def cancel_order(self, order_id: int, user_id: int) -> bool:
        """
        Cancel a pending or open order.
        
        Args:
            order_id: Order ID
            user_id: User ID (for authorization)
            
        Returns:
            True if cancelled, False otherwise
        """
        order = self.db.query(PaperOrder).filter(
            PaperOrder.id == order_id,
            PaperOrder.user_id == user_id
        ).first()
        
        if not order:
            return False
        
        if order.status not in [OrderStatus.PENDING, OrderStatus.OPEN]:
            return False
        
        order.status = OrderStatus.CANCELLED
        self.db.commit()
        
        logger.info(f"Order cancelled: {order_id}")
        return True
    
    def update_positions_prices(self, user_id: int):
        """
        Update current prices for all user positions.
        
        Args:
            user_id: User ID
        """
        positions = self.db.query(PaperPosition).filter(
            PaperPosition.user_id == user_id
        ).all()
        
        for position in positions:
            current_price = self._get_market_price(position.symbol, position.instrument_type)
            if current_price:
                position.update_current_price(current_price)
        
        self.db.commit()
        logger.info(f"Updated prices for {len(positions)} positions")
    
    def get_user_orders(self, user_id: int, limit: int = 100) -> List[PaperOrder]:
        """
        Get user's order history.
        
        Args:
            user_id: User ID
            limit: Maximum number of orders to return
            
        Returns:
            List of PaperOrder instances
        """
        return self.db.query(PaperOrder).filter(
            PaperOrder.user_id == user_id
        ).order_by(PaperOrder.created_at.desc()).limit(limit).all()
    
    def get_user_positions(self, user_id: int) -> List[PaperPosition]:
        """
        Get user's current positions.
        
        Args:
            user_id: User ID
            
        Returns:
            List of PaperPosition instances
        """
        return self.db.query(PaperPosition).filter(
            PaperPosition.user_id == user_id
        ).all()
    
    def get_portfolio_summary(self, user_id: int) -> dict:
        """
        Get user's portfolio summary.
        
        Args:
            user_id: User ID
            
        Returns:
            Portfolio summary dictionary
        """
        wallet = self.db.query(Wallet).filter(Wallet.user_id == user_id).first()
        positions = self.get_user_positions(user_id)
        
        # Update position prices
        self.update_positions_prices(user_id)
        
        # Calculate metrics
        invested_amount = sum(abs(p.quantity) * p.average_price for p in positions)
        total_pnl = sum(p.total_pnl for p in positions)
        total_balance = wallet.balance + invested_amount + total_pnl
        
        return {
            'total_balance': total_balance,
            'available_balance': wallet.balance,
            'invested_amount': invested_amount,
            'total_pnl': total_pnl,
            'total_pnl_percentage': (total_pnl / settings.INITIAL_VIRTUAL_BALANCE) * 100 if settings.INITIAL_VIRTUAL_BALANCE > 0 else 0,
            'open_positions_count': len(positions),
            'total_trades': self.db.query(PaperOrder).filter(
                PaperOrder.user_id == user_id,
                PaperOrder.status == OrderStatus.EXECUTED
            ).count()
        }

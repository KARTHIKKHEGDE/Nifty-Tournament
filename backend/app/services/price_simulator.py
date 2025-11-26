"""
Price simulator for testing live candle updates.
This simulates real-time price ticks for testing purposes.
"""

import asyncio
import random
from datetime import datetime
from typing import Dict, Set
from app.websocket.manager import manager
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class PriceSimulator:
    """Simulates live price updates for testing."""
    
    def __init__(self):
        self.running = False
        self.subscribed_symbols: Set[str] = set()
        self.base_prices: Dict[str, float] = {}
        self.task = None
    
    def add_symbol(self, symbol: str, base_price: float = 100.0):
        """Add a symbol to simulate."""
        self.subscribed_symbols.add(symbol)
        if symbol not in self.base_prices:
            self.base_prices[symbol] = base_price
        logger.info(f"Added symbol {symbol} to simulator with base price {base_price}")
    
    def remove_symbol(self, symbol: str):
        """Remove a symbol from simulation."""
        self.subscribed_symbols.discard(symbol)
        logger.info(f"Removed symbol {symbol} from simulator")
    
    async def start(self):
        """Start the price simulator."""
        if self.running:
            return
        
        self.running = True
        self.task = asyncio.create_task(self._simulate_prices())
        logger.info("Price simulator started")
    
    async def stop(self):
        """Stop the price simulator."""
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("Price simulator stopped")
    
    async def _simulate_prices(self):
        """Simulate price updates."""
        while self.running:
            try:
                for symbol in list(self.subscribed_symbols):
                    # Generate random price movement
                    base_price = self.base_prices.get(symbol, 100.0)
                    
                    # Random walk: +/- 0.5% of base price
                    change_percent = random.uniform(-0.005, 0.005)
                    price_change = base_price * change_percent
                    new_price = base_price + price_change
                    
                    # Update base price (trending)
                    self.base_prices[symbol] = new_price
                    
                    # Generate volume
                    volume = random.randint(100, 1000)
                    
                    # Create tick data
                    tick_data = {
                        "symbol": symbol,
                        "last_price": round(new_price, 2),
                        "price": round(new_price, 2),
                        "volume": volume,
                        "timestamp": int(datetime.now().timestamp() * 1000),
                    }
                    
                    # Broadcast to subscribers
                    await manager.broadcast_to_symbol(symbol, {
                        "type": "tick",
                        "data": tick_data
                    })
                
                # Update every 1-3 seconds
                await asyncio.sleep(random.uniform(1, 3))
            
            except Exception as e:
                logger.error(f"Error in price simulator: {e}")
                await asyncio.sleep(1)


# Global simulator instance
_simulator: PriceSimulator = None


def get_simulator() -> PriceSimulator:
    """Get or create price simulator instance."""
    global _simulator
    if _simulator is None:
        _simulator = PriceSimulator()
    return _simulator

"""
Real-time candle builder from tick data.
Aggregates ticks into OHLC candles for different timeframes.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Optional
from collections import defaultdict

logger = logging.getLogger(__name__)


class CandleData:
    """Single candle data structure"""
    def __init__(self, timestamp: int, open: float, high: float, low: float, close: float, volume: int):
        self.timestamp = timestamp
        self.open = open
        self.high = high
        self.low = low
        self.close = close
        self.volume = volume
    
    def to_dict(self):
        return {
            'timestamp': self.timestamp,
            'open': self.open,
            'high': self.high,
            'low': self.low,
            'close': self.close,
            'volume': self.volume
        }


class CandleBuilder:
    """
    Builds real-time candles from tick data.
    Maintains current candles for each symbol and timeframe.
    """
    
    def __init__(self, timeframe_seconds: int = 60):
        """
        Initialize candle builder.
        
        Args:
            timeframe_seconds: Candle timeframe in seconds (default: 60 = 1 minute)
        """
        self.timeframe_seconds = timeframe_seconds
        
        # Current candles: {symbol: CandleData}
        self.current_candles: Dict[str, CandleData] = {}
        
        # Last tick price and volume: {symbol: (price, volume)}
        self.last_tick: Dict[str, tuple] = {}
        
        logger.info(f"CandleBuilder initialized with {timeframe_seconds}s timeframe")
    
    def _get_candle_timestamp(self, tick_timestamp: datetime) -> int:
        """
        Get the candle's start timestamp for a given tick timestamp.
        Rounds down to the nearest timeframe interval.
        
        Args:
            tick_timestamp: Tick timestamp
            
        Returns:
            Candle timestamp in milliseconds
        """
        # Round down to nearest interval
        seconds_since_epoch = int(tick_timestamp.timestamp())
        candle_start = (seconds_since_epoch // self.timeframe_seconds) * self.timeframe_seconds
        return candle_start * 1000  # Convert to milliseconds
    
    def process_tick(self, symbol: str, price: float, volume: int, timestamp: Optional[datetime] = None) -> Optional[Dict]:
        """
        Process a single tick and update the current candle.
        
        Args:
            symbol: Trading symbol
            price: Current price
            volume: Cumulative volume for the day
            timestamp: Tick timestamp (defaults to now)
            
        Returns:
            Dict with candle data if a new candle is formed, None otherwise
        """
        if timestamp is None:
            timestamp = datetime.now()
        
        candle_ts = self._get_candle_timestamp(timestamp)
        
        # Check if we have a previous tick for volume calculation
        volume_delta = 0
        if symbol in self.last_tick:
            last_volume = self.last_tick[symbol][1]
            volume_delta = max(0, volume - last_volume)  # Delta volume for this tick
        
        # Store current tick for next calculation
        self.last_tick[symbol] = (price, volume)
        
        completed_candle = None
        
        # Check if we need to create a new candle or update existing
        if symbol not in self.current_candles:
            # Create new candle
            self.current_candles[symbol] = CandleData(
                timestamp=candle_ts,
                open=price,
                high=price,
                low=price,
                close=price,
                volume=volume_delta
            )
            logger.debug(f"Created new candle for {symbol} at {candle_ts}")
        else:
            current = self.current_candles[symbol]
            
            # Check if this tick belongs to a new candle period
            if candle_ts > current.timestamp:
                # Complete the previous candle
                completed_candle = current.to_dict()
                logger.info(f"Completed candle for {symbol}: O={completed_candle['open']}, "
                          f"H={completed_candle['high']}, L={completed_candle['low']}, "
                          f"C={completed_candle['close']}, V={completed_candle['volume']}")
                
                # Start new candle
                self.current_candles[symbol] = CandleData(
                    timestamp=candle_ts,
                    open=price,
                    high=price,
                    low=price,
                    close=price,
                    volume=volume_delta
                )
            else:
                # Update current candle
                current.high = max(current.high, price)
                current.low = min(current.low, price)
                current.close = price
                current.volume += volume_delta
        
        return completed_candle
    
    def get_current_candle(self, symbol: str) -> Optional[Dict]:
        """
        Get the current (incomplete) candle for a symbol.
        
        Args:
            symbol: Trading symbol
            
        Returns:
            Dict with current candle data or None
        """
        if symbol in self.current_candles:
            return self.current_candles[symbol].to_dict()
        return None


# Global candle builder instance
_candle_builder: Optional[CandleBuilder] = None


def get_candle_builder(timeframe_seconds: int = 60) -> CandleBuilder:
    """Get or create candle builder singleton"""
    global _candle_builder
    if _candle_builder is None:
        _candle_builder = CandleBuilder(timeframe_seconds)
    return _candle_builder

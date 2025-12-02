"""
Zerodha KiteTicker WebSocket service for real-time market data.
This service connects to Zerodha's WebSocket and relays data to connected clients.
"""

import logging
from typing import Dict, List, Optional, Callable
from kiteconnect import KiteTicker
from app.config import settings

logger = logging.getLogger(__name__)


class ZerodhaTickerService:
    """
    Manages Zerodha KiteTicker WebSocket connection.
    Follows the KiteTicker pattern for robust connection handling.
    """

    def __init__(self, api_key: str, access_token: str):
        self.api_key = api_key
        self.access_token = access_token

        # Connection state
        self.is_connected = False
        self.shutdown_requested = False

        # Subscribed instrument tokens
        self.subscribed_tokens: List[int] = []
        
        # Symbol to token mapping (for easy lookup)
        self.symbol_to_token: Dict[str, int] = {}
        self.token_to_symbol: Dict[int, str] = {}

        # Callback for tick data (will be set by WebSocket manager)
        self.on_tick_callback: Optional[Callable] = None

        # Initialize KiteTicker
        self.ticker = KiteTicker(api_key, access_token)
        self._setup_callbacks()

        logger.info("✓ MarketTickerService initialized")

    def _setup_callbacks(self):
        """Setup KiteTicker callbacks"""

        def on_connect(ws, response):
            logger.info("✓ KiteTicker connected")
            self.is_connected = True

            # Subscribe to instruments if any
            if self.subscribed_tokens:
                logger.info(f"Subscribing to {len(self.subscribed_tokens)} instruments")
                ws.subscribe(self.subscribed_tokens)
                ws.set_mode(ws.MODE_FULL, self.subscribed_tokens)

        def on_ticks(ws, ticks):
            """Handle incoming ticks from market data WebSocket"""
            if not ticks or not self.on_tick_callback:
                return

            try:
                # Process each tick
                for tick in ticks:
                    instrument_token = tick.get('instrument_token')
                    
                    # Get symbol from token
                    symbol = self.token_to_symbol.get(instrument_token, f"TOKEN_{instrument_token}")
                    
                    # Prepare tick data
                    tick_data = {
                        'symbol': symbol,
                        'instrument_token': instrument_token,
                        'last_price': tick.get('last_price', 0),
                        'volume': tick.get('volume', 0),
                        'buy_quantity': tick.get('buy_quantity', 0),
                        'sell_quantity': tick.get('sell_quantity', 0),
                        'open': tick.get('ohlc', {}).get('open', 0),
                        'high': tick.get('ohlc', {}).get('high', 0),
                        'low': tick.get('ohlc', {}).get('low', 0),
                        'close': tick.get('ohlc', {}).get('close', 0),
                        'timestamp': tick.get('timestamp'),
                        'oi': tick.get('oi', 0),
                        'oi_day_high': tick.get('oi_day_high', 0),
                        'oi_day_low': tick.get('oi_day_low', 0),
                    }
                    
                    # Call the callback (non-blocking)
                    self.on_tick_callback(tick_data)

            except Exception as e:
                logger.error(f"Error processing ticks: {e}", exc_info=True)

        def on_close(ws, code, reason):
            logger.warning(f"✗ KiteTicker closed: {code} - {reason}")
            self.is_connected = False

        def on_error(ws, code, reason):
            logger.error(f"✗ KiteTicker error: {code} - {reason}")

        def on_reconnect(ws, attempts):
            logger.info(f"Reconnecting to KiteTicker (attempt {attempts})...")

        def on_noreconnect(ws):
            logger.critical("✗ KiteTicker reconnection failed — max attempts reached")
            self.is_connected = False

        # Assign callbacks
        self.ticker.on_connect = on_connect
        self.ticker.on_ticks = on_ticks
        self.ticker.on_close = on_close
        self.ticker.on_error = on_error
        self.ticker.on_reconnect = on_reconnect
        self.ticker.on_noreconnect = on_noreconnect

    def set_tick_callback(self, callback: Callable):
        """Set callback function for tick data"""
        self.on_tick_callback = callback
        logger.info("✓ Tick callback registered")

    def subscribe(self, symbol: str, instrument_token: int):
        """
        Subscribe to an instrument.
        
        Args:
            symbol: Trading symbol (e.g., "NIFTY 50")
            instrument_token: Market API instrument token
        """
        # Store mapping
        self.symbol_to_token[symbol] = instrument_token
        self.token_to_symbol[instrument_token] = symbol

        # Add to subscribed tokens
        if instrument_token not in self.subscribed_tokens:
            self.subscribed_tokens.append(instrument_token)

        # If already connected, subscribe immediately
        if self.is_connected:
            logger.info(f"Subscribing to {symbol} (token: {instrument_token})")
            self.ticker.subscribe([instrument_token])
            self.ticker.set_mode(self.ticker.MODE_FULL, [instrument_token])
        else:
            logger.info(f"Queued subscription for {symbol} (token: {instrument_token})")

    def unsubscribe(self, symbol: str):
        """
        Unsubscribe from an instrument.
        
        Args:
            symbol: Trading symbol
        """
        instrument_token = self.symbol_to_token.get(symbol)
        
        if not instrument_token:
            logger.warning(f"Symbol {symbol} not found in subscriptions")
            return

        # Remove from subscribed tokens
        if instrument_token in self.subscribed_tokens:
            self.subscribed_tokens.remove(instrument_token)

        # Remove mappings
        del self.symbol_to_token[symbol]
        del self.token_to_symbol[instrument_token]

        # If connected, unsubscribe immediately
        if self.is_connected:
            logger.info(f"Unsubscribing from {symbol} (token: {instrument_token})")
            self.ticker.unsubscribe([instrument_token])

    def start(self):
        """Start KiteTicker connection (threaded)"""
        if self.is_connected:
            logger.warning("KiteTicker already connected")
            return

        logger.info("Starting KiteTicker connection...")
        self.shutdown_requested = False

        try:
            # Connect in threaded mode (non-blocking)
            self.ticker.connect(threaded=True)
        except Exception as e:
            logger.error(f"Failed to start KiteTicker: {e}", exc_info=True)
            raise

    def stop(self):
        """Stop KiteTicker connection"""
        logger.info("Stopping KiteTicker...")
        self.shutdown_requested = True

        try:
            self.ticker.close()
        except Exception as e:
            logger.error(f"Error stopping KiteTicker: {e}")

        self.is_connected = False
        logger.info("✓ KiteTicker stopped")

    def is_active(self) -> bool:
        """Check if KiteTicker is connected"""
        return self.is_connected


# Singleton instance
_ticker_service: Optional[MarketTickerService] = None


def get_ticker_service() -> Optional[MarketTickerService]:
    """Get or create WebSocket Ticker service singleton"""
    global _ticker_service
    
    # Only create if we have valid credentials (not empty strings)
    if (not settings.MARKET_API_KEY or 
        not settings.MARKET_ACCESS_TOKEN or
        settings.MARKET_API_KEY.strip() == "" or
        settings.MARKET_ACCESS_TOKEN.strip() == ""):
        logger.warning("Market API credentials not configured - WebSocket Ticker not available")
        return None
    
    if _ticker_service is None:
        _ticker_service = MarketTickerService(
            api_key=settings.MARKET_API_KEY,
            access_token=settings.MARKET_ACCESS_TOKEN
        )
    
    return _ticker_service


def start_ticker_service():
    """Start the KiteTicker service"""
    service = get_ticker_service()
    if service and not service.is_active():
        service.start()
        logger.info("✓ KiteTicker service started")


def stop_ticker_service():
    """Stop the KiteTicker service"""
    global _ticker_service
    if _ticker_service:
        _ticker_service.stop()
        _ticker_service = None
        logger.info("✓ KiteTicker service stopped")

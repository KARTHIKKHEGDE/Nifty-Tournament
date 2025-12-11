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

        logger.info("✓ ZerodhaTickerService initialized")

    def _setup_callbacks(self):
        """Setup KiteTicker callbacks"""

        def on_connect(ws, response):
            logger.info("🎉 [KITE] ✓✓✓ KiteTicker connected to Zerodha! ✓✓✓")
            logger.info(f"🎉 [KITE] Connection response: {response}")
            self.is_connected = True

            # Subscribe to instruments if any
            logger.info(f"📊 [KITE] Checking subscribed_tokens: {self.subscribed_tokens}")
            logger.info(f"📊 [KITE] Number of tokens: {len(self.subscribed_tokens)}")
            
            if self.subscribed_tokens and len(self.subscribed_tokens) > 0:
                logger.info(f"📡 [KITE] Subscribing to {len(self.subscribed_tokens)} instruments: {self.subscribed_tokens}")
                try:
                    ws.subscribe(list(self.subscribed_tokens))
                    ws.set_mode(ws.MODE_FULL, list(self.subscribed_tokens))
                    logger.info(f"✅ [KITE] Subscription sent to Zerodha successfully!")
                except Exception as e:
                    logger.error(f"❌ [KITE] Failed to subscribe: {e}")
            else:
                logger.error(f"❌ [KITE] CRITICAL: Connected but NO instruments queued!")
                logger.error(f"❌ [KITE] subscribed_tokens is: {self.subscribed_tokens}")
                logger.error(f"❌ [KITE] This will cause Zerodha to close the connection!")

        def on_ticks(ws, ticks):
            """Handle incoming ticks from market data WebSocket"""
            # Reduced logging - only log when no ticks or no callback
            if not ticks:
                logger.warning("⚠️ [TICKER] No ticks in response")
                return
            if not self.on_tick_callback:
                logger.warning("⚠️ [TICKER] No tick callback set!")
                return

            try:
                # Process each tick (no logging per tick to avoid blocking)
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
            logger.warning(f"❌ [KITE] ✗✗✗ KiteTicker CLOSED ✗✗✗ Code: {code}, Reason: {reason}")
            self.is_connected = False
            
            # Attempt reconnection if we have subscriptions and not shutting down
            if self.subscribed_tokens and not self.shutdown_requested:
                logger.info(f"🔄 [KITE] Will attempt reconnection in 5 seconds...")
                import time
                import threading
                def reconnect():
                    time.sleep(5)
                    if not self.shutdown_requested:
                        logger.info(f"🔄 [KITE] Attempting to reconnect...")
                        try:
                            self.start()
                        except Exception as e:
                            logger.error(f"❌ [KITE] Reconnection failed: {e}")
                threading.Thread(target=reconnect, daemon=True).start()

        def on_error(ws, code, reason):
            logger.error(f"❌ [KITE] ✗✗✗ KiteTicker ERROR ✗✗✗ Code: {code}, Reason: {reason}")
            # Don't reconnect on auth errors (1008)
            if code == 1008:
                logger.error(f"❌ [KITE] Authentication failed! Check your access_token.")
                self.is_connected = False

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
            symbol: Trading symbol
            instrument_token: Zerodha instrument token
        """
        logger.info(f"📥 [TICKER] Subscribe request: {symbol} (token: {instrument_token})")
        logger.info(f"📥 [TICKER] Current subscribed_tokens before: {self.subscribed_tokens}")
        
        # Store mappings
        self.symbol_to_token[symbol] = instrument_token
        self.token_to_symbol[instrument_token] = symbol

        # Add to subscribed tokens
        if instrument_token not in self.subscribed_tokens:
            self.subscribed_tokens.append(instrument_token)
            logger.info(f"✅ [TICKER] Added token {instrument_token} to subscribed_tokens")
        else:
            logger.info(f"ℹ️ [TICKER] Token {instrument_token} already in subscribed_tokens")

        # If already connected, subscribe immediately
        if self.is_connected:
            logger.info(f"✅ [TICKER] Already connected, subscribing to {symbol} (token: {instrument_token})")
            self.ticker.subscribe([instrument_token])
            self.ticker.set_mode(self.ticker.MODE_FULL, [instrument_token])
            logger.info(f"✅ [TICKER] Subscription sent to Zerodha for {symbol}")
        else:
            logger.info(f"⏳ [TICKER] Not connected yet, queued subscription for {symbol} (token: {instrument_token})")
            logger.info(f"📊 [TICKER] Current subscribed_tokens before start: {self.subscribed_tokens}")
            # Start the ticker if not already started (lazy start)
            if not self.shutdown_requested and len(self.subscribed_tokens) > 0:
                logger.info(f"🚀 [TICKER] Starting KiteTicker with {len(self.subscribed_tokens)} instruments queued...")
                try:
                    self.start()
                except Exception as e:
                    logger.error(f"❌ [TICKER] Failed to start: {e}")
            elif len(self.subscribed_tokens) == 0:
                logger.error(f"❌ [TICKER] Cannot start - no instruments queued!")

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
            logger.warning("⚠️ [TICKER] KiteTicker already connected")
            return

        logger.info("🚀 [TICKER] Starting KiteTicker connection...")
        logger.info(f"🔑 [TICKER] Using API Key: {self.api_key[:20]}...")
        logger.info(f"🎫 [TICKER] Using Access Token: {self.access_token[:20]}...")
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
_ticker_service: Optional[ZerodhaTickerService] = None


def get_ticker_service() -> Optional[ZerodhaTickerService]:
    """Get or create WebSocket Ticker service singleton"""
    global _ticker_service
    
    logger.info(f"🔍 [TICKER] Checking credentials...")
    logger.info(f"🔍 [TICKER] MARKET_API_KEY: '{settings.MARKET_API_KEY[:20] if settings.MARKET_API_KEY else 'EMPTY'}...'")
    logger.info(f"🔍 [TICKER] MARKET_ACCESS_TOKEN: '{settings.MARKET_ACCESS_TOKEN[:20] if settings.MARKET_ACCESS_TOKEN else 'EMPTY'}...'")
    
    # Only create if we have valid credentials (not empty strings)
    if (not settings.MARKET_API_KEY or 
        not settings.MARKET_ACCESS_TOKEN or
        settings.MARKET_API_KEY.strip() == "" or
        settings.MARKET_ACCESS_TOKEN.strip() == ""):
        logger.error("❌ [TICKER] Market API credentials not configured - WebSocket Ticker not available")
        logger.error(f"❌ [TICKER] API Key present: {bool(settings.MARKET_API_KEY)}, Access Token present: {bool(settings.MARKET_ACCESS_TOKEN)}")
        return None
    
    logger.info("✅ [TICKER] Credentials validated successfully")
    
    if _ticker_service is None:
        logger.info("🔧 [TICKER] Creating new ZerodhaTickerService instance...")
        _ticker_service = ZerodhaTickerService(
            api_key=settings.MARKET_API_KEY,
            access_token=settings.MARKET_ACCESS_TOKEN
        )
        logger.info("✅ [TICKER] ZerodhaTickerService instance created")
    else:
        logger.info("♻️ [TICKER] Returning existing ZerodhaTickerService instance")
    
    return _ticker_service


def start_ticker_service():
    """Start the KiteTicker service"""
    logger.info("🎬 [TICKER] start_ticker_service() called")
    service = get_ticker_service()
    if service:
        logger.info(f"✅ [TICKER] Service obtained, is_active: {service.is_active()}")
        if not service.is_active():
            logger.info("🚀 [TICKER] Service not active, calling start()...")
            service.start()
            logger.info("✅ [TICKER] KiteTicker service started")
        else:
            logger.info("ℹ️ [TICKER] Service already active, skipping start()")
    else:
        logger.error("❌ [TICKER] No service available to start")


def stop_ticker_service():
    """Stop the KiteTicker service"""
    global _ticker_service
    if _ticker_service:
        _ticker_service.stop()
        _ticker_service = None
        logger.info("✓ KiteTicker service stopped")

"""
Market data service for live trading data integration.
This service fetches MARKET DATA ONLY - NO order placement.
"""

from kiteconnect import KiteConnect, KiteTicker
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import pandas as pd
from app.config import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class MarketDataService:
    """
    Service for Market Data API integration.
    
    IMPORTANT: This service is used for MARKET DATA ONLY.
    NO order placement methods are implemented.
    """
    
    def __init__(self, api_key: Optional[str] = None, access_token: Optional[str] = None):
        """
        Initialize market data service.
        
        Args:
            api_key: Market API key (defaults to settings)
            access_token: Market API access token (optional, defaults to settings)
        """
        self.api_key = api_key or settings.MARKET_API_KEY
        self.access_token = access_token or settings.MARKET_ACCESS_TOKEN or None
        self.kite = KiteConnect(api_key=self.api_key)
        
        if self.access_token:
            self.kite.set_access_token(self.access_token)
            logger.info("Market data service initialized with access token")
        else:
            logger.info("Market data service initialized without access token")
    
    def get_login_url(self) -> str:
        """
        Get market data API login URL for OAuth authentication.
        
        Returns:
            Login URL string
        """
        return self.kite.login_url()
    
    def generate_session(self, request_token: str) -> Dict[str, Any]:
        """
        Generate session and get access token.
        
        Args:
            request_token: Request token from OAuth callback
            
        Returns:
            Session data including access_token
        """
        try:
            data = self.kite.generate_session(
                request_token,
                api_secret=settings.MARKET_API_SECRET
            )
            self.access_token = data["access_token"]
            self.kite.set_access_token(self.access_token)
            logger.info("Session generated successfully")
            return data
        except Exception as e:
            logger.error(f"Failed to generate session: {e}")
            raise
    
    def get_instruments(self, exchange: str = "NFO") -> List[Dict]:
        """
        Get all tradable instruments for an exchange.
        
        Args:
            exchange: Exchange name (NSE, NFO, BSE, etc.)
            
        Returns:
            List of instrument dictionaries
        """
        try:
            instruments = self.kite.instruments(exchange)
            logger.info(f"Fetched {len(instruments)} instruments from {exchange}")
            return instruments
        except Exception as e:
            logger.error(f"Failed to fetch instruments: {e}")
            return []
    
    def get_nifty_options(self, expiry_date: Optional[str] = None) -> List[Dict]:
        """
        Get NIFTY options instruments.
        
        Args:
            expiry_date: Expiry date in YYYY-MM-DD format (optional)
            
        Returns:
            List of NIFTY option instruments (CE and PE)
        """
        try:
            instruments = self.get_instruments("NFO")
            nifty_options = [
                inst for inst in instruments
                if inst['name'] == 'NIFTY' and inst['instrument_type'] in ['CE', 'PE']
            ]
            
            if expiry_date:
                nifty_options = [
                    inst for inst in nifty_options
                    if inst['expiry'].strftime('%Y-%m-%d') == expiry_date
                ]
            
            logger.info(f"Found {len(nifty_options)} NIFTY options")
            return nifty_options
        except Exception as e:
            logger.error(f"Failed to fetch NIFTY options: {e}")
            return []
    
    def get_quote(self, instruments: List[str]) -> Dict[str, Any]:
        """
        Get real-time quotes for instruments.
        
        Args:
            instruments: List of instrument identifiers (e.g., ["NSE:NIFTY 50"])
            
        Returns:
            Dictionary of quotes
        """
        try:
            quotes = self.kite.quote(instruments)
            return quotes
        except Exception as e:
            logger.error(f"Failed to fetch quotes: {e}")
            return {}
    
    def get_ltp(self, instruments: List[str]) -> Dict[str, float]:
        """
        Get Last Traded Price for instruments.
        
        Args:
            instruments: List of instrument identifiers
            
        Returns:
            Dictionary mapping instrument to LTP
        """
        try:
            ltp_data = self.kite.ltp(instruments)
            return {k: v['last_price'] for k, v in ltp_data.items()}
        except Exception as e:
            logger.error(f"Failed to fetch LTP: {e}")
            return {}
    
    def get_ohlc(self, instruments: List[str]) -> Dict[str, Any]:
        """
        Get OHLC (Open, High, Low, Close) data for instruments.
        
        Args:
            instruments: List of instrument identifiers
            
        Returns:
            Dictionary of OHLC data
        """
        try:
            ohlc_data = self.kite.ohlc(instruments)
            return ohlc_data
        except Exception as e:
            logger.error(f"Failed to fetch OHLC: {e}")
            return {}
    
    def get_historical_data(
        self,
        instrument_token: int,
        from_date: datetime,
        to_date: datetime,
        interval: str = "5minute"
    ) -> List[Dict]:
        """
        Get historical candle data.
        
        Args:
            instrument_token: Instrument token
            from_date: Start date
            to_date: End date
            interval: Candle interval (minute, 5minute, 15minute, hour, day)
            
        Returns:
            List of candle dictionaries
        """
        logger.info(f"🔵 [get_historical_data] Token: {instrument_token}, Interval: {interval}")
        logger.info(f"🔵 [get_historical_data] Date range: {from_date} to {to_date}")
        logger.info(f"🔵 [get_historical_data] Kite instance: {self.kite is not None}")
        
        try:
            if not self.kite:
                logger.error("❌ [get_historical_data] Kite instance is None - not authenticated!")
                return []
            
            logger.info(f"🔵 [get_historical_data] Calling kite.historical_data()...")
            historical_data = self.kite.historical_data(
                instrument_token=instrument_token,
                from_date=from_date,
                to_date=to_date,
                interval=interval
            )
            
            logger.info(f"✅ [get_historical_data] Received {len(historical_data)} raw candles from Kite")
            
            # Convert to list of dicts
            candles = []
            for candle in historical_data:
                candles.append({
                    'date': candle['date'],
                    'open': candle['open'],
                    'high': candle['high'],
                    'low': candle['low'],
                    'close': candle['close'],
                    'volume': candle['volume']
                })
            
            logger.info(f"✅ [get_historical_data] Fetched {len(candles)} candles for token {instrument_token}")
            return candles
        except Exception as e:
            logger.error(f"❌ [get_historical_data] Failed to fetch historical data: {str(e)}")
            logger.error(f"❌ [get_historical_data] Error type: {type(e).__name__}")
            logger.error(f"❌ [get_historical_data] Full error: {repr(e)}")
            import traceback
            logger.error(f"❌ [get_historical_data] Traceback: {traceback.format_exc()}")
            return []
    
    def get_current_price(self, symbol: str) -> Optional[float]:
        """
        Get current price for a symbol.
        
        Args:
            symbol: Symbol identifier (e.g., "NSE:NIFTY 50")
            
        Returns:
            Current price or None
        """
        try:
            ltp_data = self.get_ltp([symbol])
            return ltp_data.get(symbol)
        except Exception as e:
            logger.error(f"Failed to get current price for {symbol}: {e}")
            return None
    
    def get_options_chain(
        self,
        symbol: str = "NIFTY",
        expiry_date: Optional[str] = None
    ) -> Dict[str, List[Dict]]:
        """
        Get options chain for a symbol.
        
        Args:
            symbol: Underlying symbol (NIFTY, BANKNIFTY)
            expiry_date: Expiry date in YYYY-MM-DD format
            
        Returns:
            Dictionary with 'CE' and 'PE' lists
        """
        try:
            # Get all options for the symbol
            instruments = self.get_instruments("NFO")
            options = [
                inst for inst in instruments
                if inst['name'] == symbol and inst['instrument_type'] in ['CE', 'PE']
            ]
            
            if expiry_date:
                def expiry_matches(inst_expiry, expiry_date):
                    if isinstance(inst_expiry, str):
                        # If expiry is already a string, compare directly (strip time if present)
                        return inst_expiry.split('T')[0] == expiry_date
                    elif hasattr(inst_expiry, 'strftime'):
                        return inst_expiry.strftime('%Y-%m-%d') == expiry_date
                    return False

                options = [
                    inst for inst in options
                    if expiry_matches(inst['expiry'], expiry_date)
                ]
            
            # Get quotes for all options in batches of 500 (API rate limit)
            instrument_keys = [f"NFO:{inst['tradingsymbol']}" for inst in options]
            quotes = {}
            
            # Batch size for quote calls
            BATCH_SIZE = 500
            
            for i in range(0, len(instrument_keys), BATCH_SIZE):
                batch_keys = instrument_keys[i:i + BATCH_SIZE]
                try:
                    batch_quotes = self.get_quote(batch_keys)
                    quotes.update(batch_quotes)
                    logger.info(f"Fetched quotes for batch {i//BATCH_SIZE + 1} ({len(batch_keys)} instruments)")
                except Exception as e:
                    logger.error(f"Failed to fetch quotes for batch {i}: {e}")
            
            # Organize by CE/PE
            ce_options = []
            pe_options = []
            
            for inst in options:
                key = f"NFO:{inst['tradingsymbol']}"
                quote = quotes.get(key, {})
                
                # Extract bid/ask if available (simplified)
                bid = 0
                ask = 0
                if 'depth' in quote and 'buy' in quote['depth'] and quote['depth']['buy']:
                    bid = quote['depth']['buy'][0]['price']
                if 'depth' in quote and 'sell' in quote['depth'] and quote['depth']['sell']:
                    ask = quote['depth']['sell'][0]['price']

                option_data = {
                    'tradingsymbol': inst['tradingsymbol'],  # Frontend expects 'tradingsymbol'
                    'strike': inst['strike'],   # Frontend expects 'strike'
                    'expiry': inst['expiry'].strftime('%Y-%m-%d'), # Frontend expects 'expiry'
                    'option_type': inst['instrument_type'],
                    'instrument_token': inst['instrument_token'],
                    'ltp': quote.get('last_price', 0),
                    'oi': quote.get('oi', 0), # Frontend expects 'oi'
                    'change': 0,  # Will be calculated below
                    'volume': quote.get('volume', 0),
                    'bid': bid,
                    'ask': ask
                }
                
                # Calculate change percent
                # change % = (last_price - close) / close * 100
                if 'ohlc' in quote and quote['ohlc']['close'] > 0:
                     option_data['change'] = ((quote.get('last_price', 0) - quote['ohlc']['close']) / quote['ohlc']['close']) * 100
                else:
                     option_data['change'] = 0
                
                if inst['instrument_type'] == 'CE':
                    ce_options.append(option_data)
                else:
                    pe_options.append(option_data)
            
            # Sort by strike price
            ce_options.sort(key=lambda x: x['strike'])
            pe_options.sort(key=lambda x: x['strike'])
            
            logger.info(f"Fetched options chain: {len(ce_options)} CE, {len(pe_options)} PE")
            return {'CE': ce_options, 'PE': pe_options}
        
        except Exception as e:
            logger.error(f"Failed to fetch options chain: {e}")
            return {'CE': [], 'PE': []}


# Singleton instance
_market_data_service: Optional[MarketDataService] = None


def get_market_data_service() -> MarketDataService:
    """
    Get or create market data service singleton.
    
    Returns:
        MarketDataService instance
    """
    global _market_data_service
    if _market_data_service is None:
        _market_data_service = MarketDataService()
    return _market_data_service

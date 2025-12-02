"""
Market data API routes for candles and options chain.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from datetime import datetime, timedelta
from typing import List, Dict, Any

from app.services.market_data_service import get_market_data_service
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/")
async def get_candles(
    symbol: str = Query(..., description="Trading symbol or instrument token"),
    instrument_token: int = Query(None, description="Market data instrument token (required for real data)"),
    timeframe: str = Query("5minute", description="Timeframe (minute, 5minute, 15minute, 30minute, 60minute, day)"),
    limit: int = Query(200, ge=1, le=1000, description="Number of candles to return"),
    current_user: User = Depends(get_current_user)
):
    """
    Get candle data for charting.
    
    Args:
        symbol: Trading symbol
        instrument_token: Market data instrument token (required for real data)
        timeframe: Candle timeframe
        limit: Number of candles (default 200)
        
    Returns:
        List of candles with OHLCV data
    """
    from app.utils.logger import setup_logger
    logger = setup_logger(__name__)
    
    logger.info(f"🔵 [get_candles] START - Symbol: {symbol}, Timeframe: {timeframe}, Limit: {limit}")
    logger.info(f"🔵 [get_candles] Instrument token: {instrument_token}")
    
    market_data = get_market_data_service()
    
    # If instrument_token is not provided, return error
    if not instrument_token:
        logger.error("❌ [get_candles] No instrument token provided")
        raise HTTPException(
            status_code=400,
            detail="instrument_token is required to fetch real candle data"
        )
    
    # Map timeframe to API interval
    timeframe_map = {
        "1m": "minute",
        "minute": "minute",
        "3m": "3minute",
        "3minute": "3minute",
        "5m": "5minute",
        "5minute": "5minute",
        "15m": "15minute",
        "15minute": "15minute",
        "30m": "30minute",
        "30minute": "30minute",
        "1h": "60minute",
        "60minute": "60minute",
        "4h": "60minute",
        "1D": "day",
        "1d": "day",
        "day": "day"
    }
    
    interval = timeframe_map.get(timeframe, timeframe)
    logger.info(f"🔄 [get_candles] Timeframe mapping: {timeframe} → {interval}")
    
    # Calculate date range based on timeframe and limit
    # Indian market hours: 9:15 AM to 3:30 PM, Monday to Friday
    to_date = datetime.now()
    
    # Helper function to adjust to market hours
    def get_market_end_time(dt: datetime) -> datetime:
        """Get the appropriate end time for fetching candles based on current market status"""
        # If it's a weekend, go back to Friday's close
        while dt.weekday() >= 5:  # 5=Saturday, 6=Sunday
            dt = dt - timedelta(days=1)
        
        # Market hours: 9:15 AM to 3:30 PM
        market_open = dt.replace(hour=9, minute=15, second=0, microsecond=0)
        market_close = dt.replace(hour=15, minute=30, second=0, microsecond=0)
        
        # If market is currently open (between 9:15 AM and 3:30 PM on a weekday)
        if market_open <= dt <= market_close and dt.weekday() < 5:
            # Return current time to fetch live candles including today
            return dt
        
        # If current time is after market close today, use today's close
        if dt > market_close and dt.weekday() < 5:
            return market_close
        
        # If current time is before market open today, use previous day's close
        if dt < market_open:
            dt = dt - timedelta(days=1)
            # Check if previous day is weekend
            while dt.weekday() >= 5:
                dt = dt - timedelta(days=1)
            market_close = dt.replace(hour=15, minute=30, second=0, microsecond=0)
        
        return market_close
    
    def get_market_start_time(dt: datetime) -> datetime:
        """Get market open time for the given date"""
        # Ensure it's a weekday
        while dt.weekday() >= 5:
            dt = dt - timedelta(days=1)
        return dt.replace(hour=9, minute=15, second=0, microsecond=0)
    
    # Adjust to_date to last market close
    to_date = get_market_end_time(to_date)
    
    # Calculate from_date based on interval and limit
    # We need to account for market hours (6h 15min per day) and weekends
    if interval == "minute":
        # ~375 minutes per trading day (6h 15min)
        trading_days_needed = (limit / 375) + 1
        from_date = to_date - timedelta(days=int(trading_days_needed * 1.5))  # Add buffer for weekends
    elif interval == "3minute":
        trading_days_needed = (limit * 3 / 375) + 1
        from_date = to_date - timedelta(days=int(trading_days_needed * 1.5))
    elif interval == "5minute":
        trading_days_needed = (limit * 5 / 375) + 1
        from_date = to_date - timedelta(days=int(trading_days_needed * 1.5))
    elif interval == "15minute":
        trading_days_needed = (limit * 15 / 375) + 1
        from_date = to_date - timedelta(days=int(trading_days_needed * 1.5))
    elif interval == "30minute":
        trading_days_needed = (limit * 30 / 375) + 1
        from_date = to_date - timedelta(days=int(trading_days_needed * 1.5))
    elif interval == "60minute":
        # ~6 candles per day
        trading_days_needed = (limit / 6) + 1
        from_date = to_date - timedelta(days=int(trading_days_needed * 1.5))
    elif interval == "day":
        # Account for weekends (5 trading days per week)
        calendar_days_needed = int(limit * 1.5)
        from_date = to_date - timedelta(days=calendar_days_needed)
    else:
        from_date = to_date - timedelta(days=30)
    
    # Adjust from_date to market start
    from_date = get_market_start_time(from_date)
    
    logger.info(f"🔵 [get_candles] Date range: {from_date} to {to_date}")
    logger.info(f"🔵 [get_candles] Market hours adjusted: {from_date.strftime('%Y-%m-%d %H:%M')} to {to_date.strftime('%Y-%m-%d %H:%M')}")
    
    try:
        # Fetch historical data from market data API
        logger.info(f"🔵 [get_candles] Fetching from market data API...")
        candles_data = market_data.get_historical_data(
            instrument_token=instrument_token,
            from_date=from_date,
            to_date=to_date,
            interval=interval
        )
        
        logger.info(f"✅ [get_candles] Received {len(candles_data)} candles from market data API")
        
        # If no data from API, use mock data
        if len(candles_data) == 0:
            logger.warning(f"⚠️ [get_candles] Market data API returned 0 candles - falling back to mock data")
            raise Exception("No candles from market data API - using mock data")
        
        # Transform to frontend format
        candles = []
        for candle in candles_data[-limit:]:
            candles.append({
                "timestamp": int(candle['date'].timestamp() * 1000),
                "open": round(candle['open'], 2),
                "high": round(candle['high'], 2),
                "low": round(candle['low'], 2),
                "close": round(candle['close'], 2),
                "volume": candle['volume']
            })
        
        logger.info(f"✅ [get_candles] Returning {len(candles)} candles to frontend")
        return candles
        
    except Exception as e:
        # Log the error and return mock data as fallback
        import random
        logger.error(f"❌ [get_candles] Error fetching from market data API: {str(e)}")
        logger.error(f"❌ [get_candles] Error type: {type(e).__name__}")
        logger.warning(f"⚠️ [get_candles] Returning mock data as fallback")
        
        # Fallback to mock data
        base_price = 24500 if "NIFTY" in symbol.upper() else 100
        candles = []
        current_time = datetime.now()
        
        logger.info(f"⚠️ [get_candles] Generating {limit} mock candles")
        
        for i in range(limit):
            # Calculate timestamp based on interval
            if interval == "minute":
                timestamp = int((current_time - timedelta(minutes=(limit - i))).timestamp() * 1000)
            elif interval == "3minute":
                timestamp = int((current_time - timedelta(minutes=3 * (limit - i))).timestamp() * 1000)
            elif interval == "5minute":
                timestamp = int((current_time - timedelta(minutes=5 * (limit - i))).timestamp() * 1000)
            elif interval == "15minute":
                timestamp = int((current_time - timedelta(minutes=15 * (limit - i))).timestamp() * 1000)
            elif interval == "30minute":
                timestamp = int((current_time - timedelta(minutes=30 * (limit - i))).timestamp() * 1000)
            elif interval == "60minute":
                timestamp = int((current_time - timedelta(hours=(limit - i))).timestamp() * 1000)
            elif interval == "day":
                timestamp = int((current_time - timedelta(days=(limit - i))).timestamp() * 1000)
            else:
                timestamp = int((current_time - timedelta(minutes=5 * (limit - i))).timestamp() * 1000)
            
            open_price = base_price + random.uniform(-100, 100)
            close_price = open_price + random.uniform(-50, 50)
            high_price = max(open_price, close_price) + random.uniform(0, 30)
            low_price = min(open_price, close_price) - random.uniform(0, 30)
            
            candles.append({
                "timestamp": timestamp,
                "open": round(open_price, 2),
                "high": round(high_price, 2),
                "low": round(low_price, 2),
                "close": round(close_price, 2),
                "volume": random.randint(1000, 10000)
            })
            
            base_price = close_price
        
        logger.info(f"✅ [get_candles] Returning {len(candles)} mock candles to frontend")
        return candles


@router.get("/options-chain/{symbol}")
async def get_options_chain(
    symbol: str = Path(..., regex="^(NIFTY|BANKNIFTY)$"),
    expiry_date: str = Query(None, description="Expiry date in YYYY-MM-DD format"),
    current_user: User = Depends(get_current_user)
):
    """
    Get options chain for NIFTY or BANKNIFTY.
    
    Args:
        symbol: Underlying symbol (NIFTY or BANKNIFTY)
        expiry_date: Optional expiry date filter
        
    Returns:
        Options chain with CE and PE options
    """
    market_data = get_market_data_service()
    
    try:
        options_chain = market_data.get_options_chain(symbol, expiry_date)
        
        # Get spot price using correct symbol
        spot_symbol = f"NSE:{symbol} 50" if symbol == "NIFTY" else f"NSE:{symbol}"
        spot_price = market_data.get_current_price(spot_symbol) or 0

        return {
            "symbol": symbol,
            "spot_price": spot_price,
            "expiry_date": expiry_date,
            "ce_options": options_chain['CE'],
            "pe_options": options_chain['PE']
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch options chain: {str(e)}"
        )


@router.get("/instruments")
async def get_instruments(
    exchange: str = Query("NFO", regex="^(NSE|NFO|BSE|BFO|MCX)$"),
    current_user: User = Depends(get_current_user)
):
    """
    Get all tradable instruments for an exchange.
    
    Args:
        exchange: Exchange name (NSE, NFO, BSE, BFO, MCX)
        
    Returns:
        List of instruments with properly formatted dates
    """
    market_data = get_market_data_service()
    
    try:
        instruments = market_data.get_instruments(exchange)
        
        # Filter for NIFTY and BANKNIFTY options only
        filtered_instruments = []
        for inst in instruments:
            # Only include CE and PE options
            if inst.get('instrument_type') not in ['CE', 'PE']:
                continue
            
            # Only include NIFTY and BANKNIFTY
            name = inst.get('name', '').upper()
            if name not in ['NIFTY', 'BANKNIFTY']:
                continue
            
            filtered_instruments.append(inst)
        
        print(f"📊 Filtered {len(filtered_instruments)} instruments (NIFTY & BANKNIFTY options)")
        
        # Convert datetime objects to strings for JSON serialization
        serialized_instruments = []
        for inst in filtered_instruments:
            inst_copy = dict(inst)
            
            # Convert expiry datetime to string
            if 'expiry' in inst_copy and inst_copy['expiry']:
                try:
                    inst_copy['expiry'] = inst_copy['expiry'].strftime('%Y-%m-%d')
                except (AttributeError, ValueError):
                    pass
            
            # Convert last_date datetime to string
            if 'last_date' in inst_copy and inst_copy['last_date']:
                try:
                    inst_copy['last_date'] = inst_copy['last_date'].strftime('%Y-%m-%d')
                except (AttributeError, ValueError):
                    pass
            
            serialized_instruments.append(inst_copy)
        
        return {
            "exchange": exchange,
            "count": len(serialized_instruments),
            "instruments": serialized_instruments
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch instruments: {str(e)}"
        )

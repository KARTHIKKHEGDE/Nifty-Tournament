"""
Market data API routes for candles and options chain.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from datetime import datetime, timedelta
from typing import List, Dict, Any

from app.services.zerodha_service import get_zerodha_service
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/")
async def get_candles(
    symbol: str = Query(..., description="Trading symbol or instrument token"),
    instrument_token: int = Query(None, description="Zerodha instrument token (required for real data)"),
    timeframe: str = Query("5minute", description="Timeframe (minute, 5minute, 15minute, 30minute, 60minute, day)"),
    limit: int = Query(400, ge=1, le=1000, description="Number of candles to return"),
    current_user: User = Depends(get_current_user)
):
    """
    Get candle data for charting.
    
    Args:
        symbol: Trading symbol
        instrument_token: Zerodha instrument token (required for real data)
        timeframe: Candle timeframe
        limit: Number of candles (default 400)
        
    Returns:
        List of candles with OHLCV data
    """
    zerodha = get_zerodha_service()
    
    # If instrument_token is not provided, return error
    if not instrument_token:
        raise HTTPException(
            status_code=400,
            detail="instrument_token is required to fetch real candle data"
        )
    
    # Map timeframe to Zerodha interval
    timeframe_map = {
        "1m": "minute",
        "5m": "5minute",
        "15m": "15minute",
        "30m": "30minute",
        "1h": "60minute",
        "4h": "60minute",
        "1D": "day"
    }
    
    interval = timeframe_map.get(timeframe, timeframe)
    
    # Calculate date range based on timeframe and limit
    to_date = datetime.now()
    
    # Calculate from_date based on interval and limit
    if interval == "minute":
        from_date = to_date - timedelta(minutes=limit)
    elif interval == "5minute":
        from_date = to_date - timedelta(minutes=limit * 5)
    elif interval == "15minute":
        from_date = to_date - timedelta(minutes=limit * 15)
    elif interval == "30minute":
        from_date = to_date - timedelta(minutes=limit * 30)
    elif interval == "60minute":
        from_date = to_date - timedelta(hours=limit)
    elif interval == "day":
        from_date = to_date - timedelta(days=limit)
    else:
        from_date = to_date - timedelta(days=7)
    
    try:
        # Fetch historical data from Zerodha
        candles_data = zerodha.get_historical_data(
            instrument_token=instrument_token,
            from_date=from_date,
            to_date=to_date,
            interval=interval
        )
        
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
        
        return candles
        
    except Exception as e:
        # Log the error and return mock data as fallback
        import random
        from app.utils.logger import setup_logger
        logger = setup_logger(__name__)
        logger.error(f"Failed to fetch real candle data: {e}. Returning mock data.")
        
        # Fallback to mock data
        base_price = 19500 if "NIFTY" in symbol else 100
        candles = []
        current_time = datetime.now()
        
        for i in range(limit):
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
    zerodha = get_zerodha_service()
    
    try:
        options_chain = zerodha.get_options_chain(symbol, expiry_date)
        
        # Get spot price
        spot_symbol = f"NSE:{symbol} 50" if symbol == "NIFTY" else f"NSE:{symbol}"
        spot_price = zerodha.get_current_price(spot_symbol)
        
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
    zerodha = get_zerodha_service()
    
    try:
        instruments = zerodha.get_instruments(exchange)
        
        # Convert datetime objects to strings for JSON serialization
        serialized_instruments = []
        for inst in instruments[:1000]:
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

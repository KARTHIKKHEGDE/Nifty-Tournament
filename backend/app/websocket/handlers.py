"""
WebSocket message handlers for client requests.
"""

import json
from typing import Dict, Any
from app.websocket.manager import manager
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


async def handle_message(user_id: int, message: str):
    """
    Handle incoming WebSocket message from client.
    
    Args:
        user_id: User ID
        message: JSON message string
    """
    try:
        data = json.loads(message)
        message_type = data.get("type")
        
        if message_type == "subscribe":
            await handle_subscribe(user_id, data)
        elif message_type == "unsubscribe":
            await handle_unsubscribe(user_id, data)
        elif message_type == "ping":
            await handle_ping(user_id)
        else:
            logger.warning(f"Unknown message type: {message_type}")
            await manager.send_personal_message({
                "type": "error",
                "message": f"Unknown message type: {message_type}"
            }, user_id)
    
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON from user {user_id}: {message}")
        await manager.send_personal_message({
            "type": "error",
            "message": "Invalid JSON format"
        }, user_id)
    except Exception as e:
        logger.error(f"Error handling message from user {user_id}: {e}")
        await manager.send_personal_message({
            "type": "error",
            "message": "Internal server error"
        }, user_id)


async def handle_subscribe(user_id: int, data: Dict[str, Any]):
    """
    Handle symbol subscription request.
    
    Args:
        user_id: User ID
        data: Message data containing symbol and instrument_token
    """
    symbol = data.get("symbol")
    instrument_token = data.get("instrument_token")
    
    if not symbol:
        await manager.send_personal_message({
            "type": "error",
            "message": "Symbol is required for subscription"
        }, user_id)
        return
    
    if not instrument_token:
        await manager.send_personal_message({
            "type": "error",
            "message": "instrument_token is required for subscription"
        }, user_id)
        return
    
    # Subscribe user to symbol in manager
    logger.info(f"📝 [SUBSCRIBE] User {user_id} subscribing to {symbol} (token: {instrument_token})")
    manager.subscribe(user_id, symbol)
    
    # Subscribe to WebSocket Ticker
    from app.services.ticker_service import get_ticker_service
    ticker_service = get_ticker_service()
    logger.info(f"🔧 [SUBSCRIBE] Ticker service available: {ticker_service is not None}")
    
    if ticker_service:
        try:
            ticker_service.subscribe(symbol, instrument_token)
            logger.info(f"User {user_id} subscribed to {symbol} (token: {instrument_token})")
        except Exception as e:
            logger.error(f"Failed to subscribe to KiteTicker: {e}")
            await manager.send_personal_message({
                "type": "error",
                "message": f"Failed to subscribe to market data: {str(e)}"
            }, user_id)
            return
    else:
        logger.warning("KiteTicker service not available - using mock data")
    
    await manager.send_personal_message({
        "type": "subscribed",
        "symbol": symbol,
        "message": f"Subscribed to {symbol}"
    }, user_id)


async def handle_unsubscribe(user_id: int, data: Dict[str, Any]):
    """
    Handle symbol unsubscription request.
    
    Args:
        user_id: User ID
        data: Message data containing symbol
    """
    symbol = data.get("symbol")
    
    if not symbol:
        await manager.send_personal_message({
            "type": "error",
            "message": "Symbol is required for unsubscription"
        }, user_id)
        return
    
    # Unsubscribe user from symbol in manager
    manager.unsubscribe(user_id, symbol)
    
    # Unsubscribe from WebSocket Ticker
    from app.services.ticker_service import get_ticker_service
    ticker_service = get_ticker_service()
    
    if ticker_service:
        try:
            ticker_service.unsubscribe(symbol)
            logger.info(f"User {user_id} unsubscribed from {symbol}")
        except Exception as e:
            logger.error(f"Failed to unsubscribe from KiteTicker: {e}")
    
    await manager.send_personal_message({
        "type": "unsubscribed",
        "symbol": symbol,
        "message": f"Unsubscribed from {symbol}"
    }, user_id)


async def handle_ping(user_id: int):
    """
    Handle ping request (keepalive).
    
    Args:
        user_id: User ID
    """
    await manager.send_personal_message({
        "type": "pong"
    }, user_id)


async def broadcast_price_update(symbol: str, price: float, volume: int = 0, timestamp: str = None):
    """
    Broadcast price update to all subscribers of a symbol.
    
    Args:
        symbol: Trading symbol
        price: Current price
        volume: Trading volume
        timestamp: Timestamp of the update
    """
    from datetime import datetime
    
    if timestamp is None:
        timestamp = datetime.utcnow().isoformat()
    
    message = {
        "type": "price_update",
        "symbol": symbol,
        "price": price,
        "volume": volume,
        "timestamp": timestamp
    }
    
    await manager.broadcast_to_symbol(symbol, message)


async def broadcast_tick_data(tick_data: Dict[str, Any]):
    """
    Broadcast tick data from market data API to subscribers.
    Also builds real-time candles and broadcasts completed candles.
    
    Args:
        tick_data: Tick data dictionary from market data API
    """
    symbol = tick_data.get("symbol")
    logger.info(f"📢 [BROADCAST] broadcast_tick_data called for {symbol}")
    
    if not symbol:
        logger.warning(f"⚠️ [BROADCAST] No symbol in tick data, skipping")
        return
    
    # Build real-time candle from tick
    from app.services.candle_builder import get_candle_builder
    from datetime import datetime
    
    candle_builder = get_candle_builder(timeframe_seconds=60)  # 1-minute candles
    
    price = tick_data.get("last_price", 0)
    volume = tick_data.get("volume", 0)
    timestamp = tick_data.get("timestamp")
    
    if timestamp:
        timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
    
    # Process tick and check if a candle is completed
    completed_candle = candle_builder.process_tick(symbol, price, volume, timestamp)
    
    # Broadcast live tick data
    tick_message = {
        "type": "tick",
        "data": tick_data
    }
    await manager.broadcast_to_symbol(symbol, tick_message)
    
    # If a candle was completed, broadcast it
    if completed_candle:
        candle_message = {
            "type": "candle",
            "data": {
                "symbol": symbol,
                "candle": completed_candle
            }
        }
        await manager.broadcast_to_symbol(symbol, candle_message)
        logger.info(f"Broadcasted completed candle for {symbol}")
    
    # Also broadcast current (incomplete) candle for live updates
    current_candle = candle_builder.get_current_candle(symbol)
    if current_candle:
        current_candle_message = {
            "type": "candle_update",
            "data": {
                "symbol": symbol,
                "candle": current_candle
            }
        }
        await manager.broadcast_to_symbol(symbol, current_candle_message)

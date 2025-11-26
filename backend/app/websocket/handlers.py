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
        data: Message data containing symbol
    """
    symbol = data.get("symbol")
    
    if not symbol:
        await manager.send_personal_message({
            "type": "error",
            "message": "Symbol is required for subscription"
        }, user_id)
        return
    
    manager.subscribe(user_id, symbol)
    
    # Start price simulator for this symbol (for testing)
    from app.services.price_simulator import get_simulator
    simulator = get_simulator()
    
    # Extract base price if provided, otherwise use default
    base_price = data.get("base_price", 100.0)
    simulator.add_symbol(symbol, base_price)
    
    # Start simulator if not already running
    await simulator.start()
    
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
    
    manager.unsubscribe(user_id, symbol)
    
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
    Broadcast tick data from Zerodha to subscribers.
    
    Args:
        tick_data: Tick data dictionary from Zerodha
    """
    symbol = tick_data.get("symbol")
    
    if not symbol:
        return
    
    message = {
        "type": "tick",
        "data": tick_data
    }
    
    await manager.broadcast_to_symbol(symbol, message)

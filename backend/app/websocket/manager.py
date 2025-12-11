"""
WebSocket connection manager for handling client connections.
"""

from fastapi import WebSocket
from typing import Dict, Set, List
import json
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class ConnectionManager:
    """
    Manager for WebSocket connections.
    
    Handles:
    - Client connection/disconnection
    - Message broadcasting
    - Symbol subscriptions
    - User-specific messages
    """
    
    def __init__(self):
        """Initialize connection manager."""
        # Active connections: {user_id: WebSocket}
        self.active_connections: Dict[int, WebSocket] = {}
        
        # Symbol subscriptions: {symbol: set of user_ids}
        self.subscriptions: Dict[str, Set[int]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """
        Accept and store a new WebSocket connection.
        
        Args:
            websocket: WebSocket connection
            user_id: User ID
        """
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"WebSocket connected: User {user_id}")
    
    def disconnect(self, user_id: int):
        """
        Remove a WebSocket connection.
        
        Args:
            user_id: User ID
        """
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            
            # Remove from all subscriptions
            for symbol in list(self.subscriptions.keys()):
                if user_id in self.subscriptions[symbol]:
                    self.subscriptions[symbol].remove(user_id)
                    
                    # Clean up empty subscriptions
                    if not self.subscriptions[symbol]:
                        del self.subscriptions[symbol]
            
            logger.info(f"WebSocket disconnected: User {user_id}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        """
        Send a message to a specific user.
        
        Args:
            message: Message dictionary
            user_id: User ID
        """
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
                self.disconnect(user_id)
    
    async def broadcast(self, message: dict):
        """
        Broadcast a message to all connected clients.
        
        Args:
            message: Message dictionary
        """
        disconnected_users = []
        
        for user_id, connection in self.active_connections.items():
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting to user {user_id}: {e}")
                disconnected_users.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected_users:
            self.disconnect(user_id)
    
    async def broadcast_to_symbol(self, symbol: str, message: dict):
        """
        Broadcast a message to all users subscribed to a symbol.
        
        Args:
            symbol: Trading symbol
            message: Message dictionary
        """
        logger.info(f"📡 [MANAGER] Broadcasting to symbol: {symbol}, subscribers: {len(self.subscriptions.get(symbol, []))}")
        if symbol not in self.subscriptions:
            logger.warning(f"⚠️ [MANAGER] No subscribers for {symbol}")
            return
        
        disconnected_users = []
        
        for user_id in self.subscriptions[symbol]:
            if user_id in self.active_connections:
                try:
                    await self.active_connections[user_id].send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending to user {user_id}: {e}")
                    disconnected_users.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected_users:
            self.disconnect(user_id)
    
    def subscribe(self, user_id: int, symbol: str):
        """
        Subscribe a user to a symbol.
        
        Args:
            user_id: User ID
            symbol: Trading symbol
        """
        if symbol not in self.subscriptions:
            self.subscriptions[symbol] = set()
        
        self.subscriptions[symbol].add(user_id)
        logger.info(f"User {user_id} subscribed to {symbol}")
    
    def unsubscribe(self, user_id: int, symbol: str):
        """
        Unsubscribe a user from a symbol.
        
        Args:
            user_id: User ID
            symbol: Trading symbol
        """
        if symbol in self.subscriptions and user_id in self.subscriptions[symbol]:
            self.subscriptions[symbol].remove(user_id)
            
            # Clean up empty subscriptions
            if not self.subscriptions[symbol]:
                del self.subscriptions[symbol]
            
            logger.info(f"User {user_id} unsubscribed from {symbol}")
    
    def get_subscribed_symbols(self) -> List[str]:
        """
        Get list of all subscribed symbols.
        
        Returns:
            List of symbol strings
        """
        return list(self.subscriptions.keys())
    
    def get_connection_count(self) -> int:
        """
        Get number of active connections.
        
        Returns:
            Number of connections
        """
        return len(self.active_connections)


# Global connection manager instance
manager = ConnectionManager()

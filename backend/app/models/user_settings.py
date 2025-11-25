"""
User Settings model for storing user preferences and chart settings.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base
import json


class UserSettings(Base):
    """
    User Settings model for storing user preferences.
    
    Attributes:
        id: Primary key
        user_id: Foreign key to User (one-to-one)
        theme: UI theme (dark/light)
        default_timeframe: Default chart timeframe
        chart_type: Default chart type (candlestick, line, etc.)
        indicators: Enabled indicators (JSON)
        drawing_tools: Saved drawing tools (JSON)
        notifications_enabled: Whether notifications are enabled
        email_notifications: Whether email notifications are enabled
        created_at: When settings were created
        updated_at: Last update timestamp
    
    Relationships:
        user: The user (one-to-one)
    """
    
    __tablename__ = "user_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # UI Preferences
    theme = Column(String, default="dark", nullable=False)  # dark, light
    default_timeframe = Column(String, default="5m", nullable=False)  # 1m, 5m, 15m, 1h, 1d
    chart_type = Column(String, default="candlestick", nullable=False)  # candlestick, line, area
    
    # Chart Settings (stored as JSON)
    indicators = Column(Text, default="[]", nullable=False)  # List of enabled indicators
    drawing_tools = Column(Text, default="[]", nullable=False)  # Saved drawing tools
    chart_settings = Column(Text, default="{}", nullable=False)  # Additional chart settings
    
    # Notification Preferences
    notifications_enabled = Column(Boolean, default=True, nullable=False)
    email_notifications = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="settings")
    
    def __repr__(self):
        return f"<UserSettings(user_id={self.user_id}, theme={self.theme}, timeframe={self.default_timeframe})>"
    
    def get_indicators(self) -> list:
        """Get indicators as Python list."""
        try:
            return json.loads(self.indicators)
        except:
            return []
    
    def set_indicators(self, indicators_list: list):
        """Set indicators from Python list."""
        self.indicators = json.dumps(indicators_list)
    
    def get_drawing_tools(self) -> list:
        """Get drawing tools as Python list."""
        try:
            return json.loads(self.drawing_tools)
        except:
            return []
    
    def set_drawing_tools(self, tools_list: list):
        """Set drawing tools from Python list."""
        self.drawing_tools = json.dumps(tools_list)
    
    def get_chart_settings(self) -> dict:
        """Get chart settings as Python dict."""
        try:
            return json.loads(self.chart_settings)
        except:
            return {}
    
    def set_chart_settings(self, settings_dict: dict):
        """Set chart settings from Python dict."""
        self.chart_settings = json.dumps(settings_dict)

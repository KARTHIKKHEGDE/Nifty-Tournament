"""
User settings schemas.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class UserSettingsUpdate(BaseModel):
    """Schema for updating user settings."""
    theme: Optional[str] = Field(None, pattern="^(dark|light)$")
    default_timeframe: Optional[str] = Field(None, pattern="^(1m|5m|15m|30m|1h|4h|1d)$")
    chart_type: Optional[str] = Field(None, pattern="^(candlestick|line|area|bar)$")
    indicators: Optional[List[str]] = None
    drawing_tools: Optional[List[Dict]] = None
    chart_settings: Optional[Dict] = None
    notifications_enabled: Optional[bool] = None
    email_notifications: Optional[bool] = None


class UserSettingsResponse(BaseModel):
    """Schema for user settings response."""
    id: int
    user_id: int
    theme: str
    default_timeframe: str
    chart_type: str
    indicators: str  # JSON string
    drawing_tools: str  # JSON string
    chart_settings: str  # JSON string
    notifications_enabled: bool
    email_notifications: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

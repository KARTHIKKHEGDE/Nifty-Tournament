"""
Helper utility functions.
"""

from datetime import datetime, time
import pytz
from app.config import settings


def is_market_open() -> bool:
    """
    Check if Indian stock market is currently open.
    Market hours: 9:15 AM - 3:30 PM IST (Monday-Friday)
    
    Returns:
        True if market is open, False otherwise
    """
    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.now(ist)
    
    # Check if it's a weekday (Monday=0, Sunday=6)
    if now.weekday() >= 5:  # Saturday or Sunday
        return False
    
    # Check if current time is within market hours
    market_open = time(settings.MARKET_OPEN_HOUR, settings.MARKET_OPEN_MINUTE)
    market_close = time(settings.MARKET_CLOSE_HOUR, settings.MARKET_CLOSE_MINUTE)
    current_time = now.time()
    
    return market_open <= current_time <= market_close


def get_current_ist_time() -> datetime:
    """
    Get current time in IST timezone.
    
    Returns:
        Current datetime in IST
    """
    ist = pytz.timezone('Asia/Kolkata')
    return datetime.now(ist)


def format_currency(amount: float, currency: str = "INR") -> str:
    """
    Format amount as currency string.
    
    Args:
        amount: Amount to format
        currency: Currency code (default: INR)
        
    Returns:
        Formatted currency string
    """
    if currency == "INR":
        return f"₹{amount:,.2f}"
    return f"{currency} {amount:,.2f}"


def calculate_percentage_change(old_value: float, new_value: float) -> float:
    """
    Calculate percentage change between two values.
    
    Args:
        old_value: Original value
        new_value: New value
        
    Returns:
        Percentage change
    """
    if old_value == 0:
        return 0.0
    return ((new_value - old_value) / old_value) * 100

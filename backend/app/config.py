"""
Configuration module for the Nifty Options Trading Platform.
Loads environment variables and provides application settings.
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App Info
    APP_NAME: str = "Nifty Options Trading Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str
    
    # Redis
    REDIS_URL: str
    
    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Zerodha API (for market data only)
    ZERODHA_API_KEY: str
    ZERODHA_API_SECRET: str
    ZERODHA_ACCESS_TOKEN: str = ""  # Optional: Pre-generated access token
    
    # Paper Trading Settings
    PAPER_TRADING_ONLY: bool = True  # Always True - this is a paper trading platform
    INITIAL_VIRTUAL_BALANCE: float = 100000.0  # ₹1,00,000
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS_ORIGINS string to list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # Celery
    CELERY_BROKER_URL: str = ""
    CELERY_RESULT_BACKEND: str = ""
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # Market Hours (IST)
    MARKET_OPEN_HOUR: int = 9
    MARKET_OPEN_MINUTE: int = 15
    MARKET_CLOSE_HOUR: int = 15
    MARKET_CLOSE_MINUTE: int = 30
    
    # Trading Limits (for paper trading)
    MAX_POSITION_SIZE: float = 50000.0  # Max position value
    MAX_ORDERS_PER_DAY: int = 100
    MIN_ORDER_VALUE: float = 100.0
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Ensure Celery URLs default to Redis URL if not set
if not settings.CELERY_BROKER_URL:
    settings.CELERY_BROKER_URL = settings.REDIS_URL
if not settings.CELERY_RESULT_BACKEND:
    settings.CELERY_RESULT_BACKEND = settings.REDIS_URL

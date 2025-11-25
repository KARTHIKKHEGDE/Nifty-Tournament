"""
JWT utilities for token creation and validation.
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from app.config import settings


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary containing the payload data
        expires_delta: Optional expiration time delta
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT access token.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded payload dictionary or None if invalid
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def verify_token(token: str) -> Optional[int]:
    """
    Verify token and extract user ID.
    
    Args:
        token: JWT token string
        
    Returns:
        User ID if token is valid, None otherwise
    """
    payload = decode_access_token(token)
    if payload is None:
        return None
    
    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        return None
    
    return int(user_id)

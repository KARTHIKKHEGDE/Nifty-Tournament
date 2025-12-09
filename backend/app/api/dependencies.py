"""
API dependencies for authentication and database sessions.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from app.db import get_db
from app.models.user import User
from app.utils.jwt_utils import verify_token
from app.services.auth_service import AuthService

# Security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer credentials
        db: Database session
        
    Returns:
        Current User instance
        
    Raises:
        HTTPException: If authentication fails
    """
    token = credentials.credentials
    print(f"🔑 [AUTH] Received token: {token[:50]}..." if len(token) > 50 else f"🔑 [AUTH] Received token: {token}")
    user_id = verify_token(token)
    print(f"✅ [AUTH] Token verified, user_id: {user_id}")
    
    if user_id is None:
        print("❌ [AUTH] Token verification failed - user_id is None")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = AuthService.get_user_by_id(db, user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user.
    
    Args:
        current_user: Current user from get_current_user
        
    Returns:
        Current User instance
        
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current admin user.
    Checks if user is admin by:
    1. is_admin flag in database, OR
    2. Email matches ADMIN_EMAIL from environment
    
    Args:
        current_user: Current user from get_current_user
        
    Returns:
        Current admin User instance
        
    Raises:
        HTTPException: If user is not an admin
    """
    import os
    
    # Check if user is admin in database OR has admin email from env
    admin_email = os.getenv('ADMIN_EMAIL', '').strip().lower()
    user_email = current_user.email.strip().lower()
    
    is_admin = current_user.is_admin or (admin_email and user_email == admin_email)
    
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get current user if authenticated, None otherwise.
    Useful for endpoints that work with or without authentication.
    
    Args:
        credentials: Optional HTTP Bearer credentials
        db: Database session
        
    Returns:
        User instance or None
    """
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        user_id = verify_token(token)
        
        if user_id is None:
            return None
        
        user = AuthService.get_user_by_id(db, user_id)
        return user if user and user.is_active else None
    except:
        return None

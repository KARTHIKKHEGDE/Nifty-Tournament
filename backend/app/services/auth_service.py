"""
Authentication service for user management and JWT tokens.
"""

from passlib.context import CryptContext
from sqlalchemy.orm import Session
from typing import Optional
from datetime import timedelta

from app.models.user import User
from app.models.wallet import Wallet
from app.models.user_settings import UserSettings
from app.schemas.user import UserCreate, UserLogin
from app.utils.jwt_utils import create_access_token
from app.config import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

# Password hashing context
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


class AuthService:
    """Service for authentication and user management."""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hash a password using Argon2.
        
        Args:
            password: Plain text password
            
        Returns:
            Hashed password
        """
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verify a password against its hash.
        
        Args:
            plain_password: Plain text password
            hashed_password: Hashed password
            
        Returns:
            True if password matches, False otherwise
        """
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> User:
        """
        Create a new user with wallet and settings.
        
        Args:
            db: Database session
            user_data: User creation data
            
        Returns:
            Created user instance
            
        Raises:
            ValueError: If email or username already exists
        """
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise ValueError("Email already registered")
        
        # Check if username already exists
        existing_username = db.query(User).filter(User.username == user_data.username).first()
        if existing_username:
            raise ValueError("Username already taken")
        
        # Create user
        hashed_password = AuthService.hash_password(user_data.password)
        user = User(
            email=user_data.email,
            username=user_data.username,
            password_hash=hashed_password,
            is_active=True,
            is_admin=False
        )
        db.add(user)
        db.flush()  # Flush to get user.id
        
        # Create wallet with initial balance
        wallet = Wallet(
            user_id=user.id,
            balance=settings.INITIAL_VIRTUAL_BALANCE,
            currency="INR",
            total_deposits=settings.INITIAL_VIRTUAL_BALANCE
        )
        db.add(wallet)
        
        # Create default user settings
        user_settings = UserSettings(
            user_id=user.id,
            theme="dark",
            default_timeframe="5m",
            chart_type="candlestick"
        )
        db.add(user_settings)
        
        db.commit()
        db.refresh(user)
        
        logger.info(f"Created new user: {user.email} (ID: {user.id})")
        return user
    
    @staticmethod
    def authenticate_user(db: Session, login_data: UserLogin) -> Optional[User]:
        """
        Authenticate a user with email and password.
        
        Args:
            db: Database session
            login_data: Login credentials
            
        Returns:
            User instance if authentication successful, None otherwise
        """
        user = db.query(User).filter(User.email == login_data.email).first()
        
        if not user:
            logger.warning(f"Login attempt with non-existent email: {login_data.email}")
            return None
        
        if not user.is_active:
            logger.warning(f"Login attempt for inactive user: {login_data.email}")
            return None
        
        if not AuthService.verify_password(login_data.password, user.password_hash):
            logger.warning(f"Failed login attempt for user: {login_data.email}")
            return None
        
        logger.info(f"Successful login: {user.email} (ID: {user.id})")
        return user
    
    @staticmethod
    def create_token(user: User) -> str:
        """
        Create JWT access token for user.
        
        Args:
            user: User instance
            
        Returns:
            JWT access token
        """
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email},
            expires_delta=access_token_expires
        )
        return access_token
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """
        Get user by ID.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            User instance or None
        """
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """
        Get user by email.
        
        Args:
            db: Database session
            email: User email
            
        Returns:
            User instance or None
        """
        return db.query(User).filter(User.email == email).first()

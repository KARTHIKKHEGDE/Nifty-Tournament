"""
Script to create an admin user.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SessionLocal
from app.models.user import User
from app.models.wallet import Wallet
from app.models.user_settings import UserSettings
from app.services.auth_service import AuthService
from app.config import settings


def create_admin():
    """Create an admin user."""
    db = SessionLocal()
    
    try:
        # Get admin details
        print("=== Create Admin User ===")
        email = input("Enter admin email: ").strip()
        username = input("Enter admin username: ").strip()
        password = input("Enter admin password: ").strip()
        
        # Validate inputs
        if not email or not username or not password:
            print("Error: All fields are required")
            return
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"Error: User with email {email} already exists")
            return
        
        # Create admin user
        hashed_password = AuthService.hash_password(password)
        admin_user = User(
            email=email,
            username=username,
            password_hash=hashed_password,
            is_active=True,
            is_admin=True
        )
        db.add(admin_user)
        db.flush()
        
        # Create wallet
        wallet = Wallet(
            user_id=admin_user.id,
            balance=settings.INITIAL_VIRTUAL_BALANCE,
            currency="INR",
            total_deposits=settings.INITIAL_VIRTUAL_BALANCE
        )
        db.add(wallet)
        
        # Create settings
        user_settings = UserSettings(
            user_id=admin_user.id,
            theme="dark",
            default_timeframe="5m",
            chart_type="candlestick"
        )
        db.add(user_settings)
        
        db.commit()
        
        print(f"\n✅ Admin user created successfully!")
        print(f"Email: {email}")
        print(f"Username: {username}")
        print(f"Admin: Yes")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error creating admin user: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()

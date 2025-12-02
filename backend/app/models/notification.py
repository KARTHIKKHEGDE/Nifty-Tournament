"""
Notification model for system notifications.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base
import enum


class NotificationType(str, enum.Enum):
    """Notification types."""
    INFO = "INFO"
    SUCCESS = "SUCCESS"
    WARNING = "WARNING"
    ERROR = "ERROR"
    TOURNAMENT = "TOURNAMENT"
    PRIZE = "PRIZE"
    ADMIN = "ADMIN"


class Notification(Base):
    """
    Notification model for system notifications.
    
    Stores notifications sent to users for various events like
    tournament updates, prize distributions, admin messages, etc.
    
    Attributes:
        id: Primary key
        user_id: Foreign key to User
        title: Notification title
        message: Notification message
        type: Notification type (INFO, SUCCESS, WARNING, ERROR, etc.)
        is_read: Whether notification has been read
        action_url: Optional URL for action button
        metadata: Additional JSON data
        created_at: When notification was created
        read_at: When notification was read
    
    Relationships:
        user: The user who receives the notification (many-to-one)
    """
    
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Notification content
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(SQLEnum(NotificationType), default=NotificationType.INFO, nullable=False, index=True)
    
    # Status
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    
    # Optional action
    action_url = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationship
    user = relationship("User", back_populates="notifications")
    
    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, type={self.type}, read={self.is_read})>"
    
    def mark_as_read(self):
        """Mark notification as read."""
        if not self.is_read:
            self.is_read = True
            self.read_at = func.now()

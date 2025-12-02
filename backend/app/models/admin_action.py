"""
Admin Action model for tracking administrative operations.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.db import Base


class AdminAction(Base):
    """
    Admin Action model for audit trail.
    
    Tracks all administrative actions performed on the platform
    for security, compliance, and debugging purposes.
    
    Attributes:
        id: Primary key
        admin_user_id: ID of the admin who performed the action
        action_type: Type of action (CREATE_TOURNAMENT, DELETE_USER, etc.)
        target_type: Type of target entity (TOURNAMENT, USER, etc.)
        target_id: ID of the target entity
        description: Human-readable description of the action
        action_metadata: Additional JSON data about the action
        ip_address: IP address of the admin
        user_agent: Browser/client user agent
        created_at: Timestamp when action was performed
    """
    
    __tablename__ = "admin_actions"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_user_id = Column(Integer, nullable=False, index=True)
    
    # Action details
    action_type = Column(String(100), nullable=False, index=True)
    target_type = Column(String(50), nullable=False, index=True)
    target_id = Column(Integer, nullable=True, index=True)
    
    # Description and metadata
    description = Column(Text, nullable=False)
    action_metadata = Column(JSON, nullable=True)
    
    # Request info
    ip_address = Column(String(45), nullable=True)  # IPv6 max length
    user_agent = Column(String(500), nullable=True)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    def __repr__(self):
        return f"<AdminAction(id={self.id}, admin={self.admin_user_id}, action={self.action_type}, target={self.target_type}:{self.target_id})>"

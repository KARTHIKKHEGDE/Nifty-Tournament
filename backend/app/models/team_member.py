"""
Team Member model for tracking team memberships.
"""

from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base
import enum


class MemberRole(str, enum.Enum):
    """Member role in team."""
    CAPTAIN = "CAPTAIN"
    MEMBER = "MEMBER"


class TeamMember(Base):
    """
    Team Member model for tracking team memberships.
    
    Attributes:
        id: Primary key
        team_id: Foreign key to Team
        user_id: Foreign key to User
        role: Member role (captain or member)
        is_active: Whether member is active
        joined_at: When user joined the team
    
    Relationships:
        team: The team
        user: The user
    """
    
    __tablename__ = "team_members"
    __table_args__ = (
        UniqueConstraint('team_id', 'user_id', name='unique_team_user'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(SQLEnum(MemberRole), default=MemberRole.MEMBER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")
    
    def __repr__(self):
        return f"<TeamMember(team_id={self.team_id}, user_id={self.user_id}, role={self.role})>"

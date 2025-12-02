"""
Team model for team-based tournaments.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base


class Team(Base):
    """
    Team model for team tournaments.
    
    Attributes:
        id: Primary key
        tournament_id: Foreign key to Tournament
        name: Team name
        description: Team description
        captain_id: User ID of the team captain
        is_full: Whether team has reached max size
        total_members: Current number of team members
        created_at: When team was created
        updated_at: Last update timestamp
    
    Relationships:
        tournament: The tournament this team belongs to
        captain: The team captain (User)
        members: Team members (many-to-many through TeamMember)
        participant: Tournament participant record for this team
    """
    
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    captain_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    is_full = Column(Boolean, default=False, nullable=False)
    total_members = Column(Integer, default=1, nullable=False)  # Starts with captain
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    tournament = relationship("Tournament", back_populates="teams")
    captain = relationship("User", foreign_keys=[captain_id])
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Team(id={self.id}, name={self.name}, tournament_id={self.tournament_id}, members={self.total_members})>"
    
    def is_member(self, user_id: int) -> bool:
        """Check if a user is a member of this team."""
        return any(member.user_id == user_id for member in self.members)
    
    def can_add_member(self, max_size: int) -> bool:
        """Check if team can accept new members."""
        return not self.is_full and self.total_members < max_size

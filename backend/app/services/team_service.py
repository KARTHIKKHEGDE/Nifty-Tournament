"""
Team service for managing team tournaments.
"""

from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.models.team import Team
from app.models.team_member import TeamMember, MemberRole
from app.models.tournament import Tournament, TournamentType, TournamentStatus
from app.models.tournament_participant import TournamentParticipant
from app.models.user import User


class TeamService:
    """Service for managing teams in team tournaments."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_team(self, tournament_id: int, user_id: int, name: str, description: Optional[str] = None) -> Team:
        """
        Create a new team for a tournament.
        
        Args:
            tournament_id: Tournament ID
            user_id: Captain user ID
            name: Team name
            description: Team description
            
        Returns:
            Created team
            
        Raises:
            ValueError: If tournament doesn't exist, not a team tournament, or user already in a team
        """
        # Verify tournament exists and is team-based
        tournament = self.db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if not tournament:
            raise ValueError("Tournament not found")
        
        if tournament.tournament_type != TournamentType.TEAM:
            raise ValueError("This tournament is not a team tournament")
        
        if tournament.status not in [TournamentStatus.UPCOMING, TournamentStatus.REGISTRATION_OPEN]:
            raise ValueError("Cannot create teams for tournaments that have started")
        
        # Check if user already in a team for this tournament
        existing_membership = self.db.query(TeamMember).join(Team).filter(
            Team.tournament_id == tournament_id,
            TeamMember.user_id == user_id,
            TeamMember.is_active == True
        ).first()
        
        if existing_membership:
            raise ValueError("You are already in a team for this tournament")
        
        # Create team
        team = Team(
            tournament_id=tournament_id,
            name=name,
            description=description,
            captain_id=user_id,
            total_members=1,
            is_full=False
        )
        self.db.add(team)
        self.db.flush()
        
        # Add captain as team member
        captain_member = TeamMember(
            team_id=team.id,
            user_id=user_id,
            role=MemberRole.CAPTAIN,
            is_active=True
        )
        self.db.add(captain_member)
        self.db.commit()
        self.db.refresh(team)
        
        return team
    
    def get_team(self, team_id: int) -> Optional[Team]:
        """Get team by ID."""
        return self.db.query(Team).filter(Team.id == team_id).first()
    
    def get_tournament_teams(self, tournament_id: int) -> List[Team]:
        """Get all teams for a tournament."""
        return self.db.query(Team).filter(Team.tournament_id == tournament_id).all()
    
    def get_user_team(self, tournament_id: int, user_id: int) -> Optional[Team]:
        """Get user's team for a specific tournament."""
        membership = self.db.query(TeamMember).join(Team).filter(
            Team.tournament_id == tournament_id,
            TeamMember.user_id == user_id,
            TeamMember.is_active == True
        ).first()
        
        return membership.team if membership else None
    
    def join_team(self, team_id: int, user_id: int) -> TeamMember:
        """
        Join an existing team.
        
        Args:
            team_id: Team ID
            user_id: User ID
            
        Returns:
            Created team member
            
        Raises:
            ValueError: If team is full, user already in team, etc.
        """
        team = self.get_team(team_id)
        if not team:
            raise ValueError("Team not found")
        
        # Get tournament
        tournament = self.db.query(Tournament).filter(Tournament.id == team.tournament_id).first()
        if not tournament:
            raise ValueError("Tournament not found")
        
        if tournament.status not in [TournamentStatus.UPCOMING, TournamentStatus.REGISTRATION_OPEN]:
            raise ValueError("Cannot join teams for tournaments that have started")
        
        # Check if user already in a team for this tournament
        existing_membership = self.db.query(TeamMember).join(Team).filter(
            Team.tournament_id == team.tournament_id,
            TeamMember.user_id == user_id,
            TeamMember.is_active == True
        ).first()
        
        if existing_membership:
            raise ValueError("You are already in a team for this tournament")
        
        # Check if team is full
        if not team.can_add_member(tournament.team_size):
            raise ValueError("Team is full")
        
        # Add member
        member = TeamMember(
            team_id=team_id,
            user_id=user_id,
            role=MemberRole.MEMBER,
            is_active=True
        )
        self.db.add(member)
        
        # Update team member count
        team.total_members += 1
        if team.total_members >= tournament.team_size:
            team.is_full = True
        
        self.db.commit()
        self.db.refresh(member)
        
        return member
    
    def leave_team(self, team_id: int, user_id: int) -> None:
        """
        Leave a team.
        
        Args:
            team_id: Team ID
            user_id: User ID
            
        Raises:
            ValueError: If user not in team, is captain, etc.
        """
        team = self.get_team(team_id)
        if not team:
            raise ValueError("Team not found")
        
        # Get tournament
        tournament = self.db.query(Tournament).filter(Tournament.id == team.tournament_id).first()
        if tournament.status not in [TournamentStatus.UPCOMING, TournamentStatus.REGISTRATION_OPEN]:
            raise ValueError("Cannot leave team after tournament has started")
        
        # Get member
        member = self.db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
            TeamMember.is_active == True
        ).first()
        
        if not member:
            raise ValueError("You are not a member of this team")
        
        # Captain cannot leave unless they're the only member
        if member.role == MemberRole.CAPTAIN and team.total_members > 1:
            raise ValueError("Captain cannot leave team. Transfer captaincy or disband team first")
        
        # Remove member
        self.db.delete(member)
        team.total_members -= 1
        team.is_full = False
        
        # If captain left and was last member, delete team
        if team.total_members == 0:
            self.db.delete(team)
        
        self.db.commit()
    
    def register_team_for_tournament(self, team_id: int) -> TournamentParticipant:
        """
        Register a team for tournament participation.
        
        Args:
            team_id: Team ID
            
        Returns:
            Created tournament participant
            
        Raises:
            ValueError: If team not full, already registered, etc.
        """
        team = self.get_team(team_id)
        if not team:
            raise ValueError("Team not found")
        
        tournament = self.db.query(Tournament).filter(Tournament.id == team.tournament_id).first()
        if not tournament:
            raise ValueError("Tournament not found")
        
        # Check if team is full
        if team.total_members < tournament.team_size:
            raise ValueError(f"Team must have {tournament.team_size} members to register")
        
        # Check if already registered
        existing = self.db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == team.tournament_id,
            TournamentParticipant.team_id == team_id
        ).first()
        
        if existing:
            raise ValueError("Team already registered for this tournament")
        
        # Create participant entry
        participant = TournamentParticipant(
            tournament_id=team.tournament_id,
            team_id=team_id,
            user_id=None,  # Team participation
            entry_fee_paid=tournament.entry_fee == 0,  # Auto-paid if free
            starting_balance=tournament.starting_balance,
            current_balance=tournament.starting_balance,
            total_pnl=0.0
        )
        
        self.db.add(participant)
        tournament.current_participants += 1
        
        self.db.commit()
        self.db.refresh(participant)
        
        return participant
    
    def get_team_members(self, team_id: int) -> List[TeamMember]:
        """Get all members of a team."""
        return self.db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.is_active == True
        ).all()
    
    def transfer_captaincy(self, team_id: int, current_captain_id: int, new_captain_id: int) -> None:
        """
        Transfer team captaincy to another member.
        
        Args:
            team_id: Team ID
            current_captain_id: Current captain user ID
            new_captain_id: New captain user ID
            
        Raises:
            ValueError: If not authorized, new captain not a member, etc.
        """
        team = self.get_team(team_id)
        if not team:
            raise ValueError("Team not found")
        
        if team.captain_id != current_captain_id:
            raise ValueError("Only the current captain can transfer captaincy")
        
        # Get current and new captain members
        current_member = self.db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.user_id == current_captain_id
        ).first()
        
        new_member = self.db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.user_id == new_captain_id,
            TeamMember.is_active == True
        ).first()
        
        if not new_member:
            raise ValueError("New captain must be a member of the team")
        
        # Update roles
        current_member.role = MemberRole.MEMBER
        new_member.role = MemberRole.CAPTAIN
        team.captain_id = new_captain_id
        
        self.db.commit()

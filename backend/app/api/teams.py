"""
Team API routes for team tournaments.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db
from app.schemas.tournament import (
    TeamCreate, TeamUpdate, TeamResponse, TeamMemberResponse,
    TeamJoinRequest, TeamLeaderboardEntry
)
from app.services.team_service import TeamService
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.team_member import MemberRole
from app.models.tournament import Tournament

router = APIRouter()


@router.post("", response_model=TeamResponse)
async def create_team(
    team_data: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new team for a tournament.
    
    Args:
        team_data: Team creation data
        
    Returns:
        Created team with details
    """
    service = TeamService(db)
    
    try:
        team = service.create_team(
            tournament_id=team_data.tournament_id,
            user_id=current_user.id,
            name=team_data.name,
            description=team_data.description
        )
        
        # Get tournament for max_members
        tournament = db.query(Tournament).filter(Tournament.id == team.tournament_id).first()
        
        # Build response with member details
        members = []
        for member in team.members:
            user = db.query(User).filter(User.id == member.user_id).first()
            members.append({
                "id": member.id,
                "user_id": member.user_id,
                "username": user.username if user else "Unknown",
                "role": member.role,
                "joined_at": member.joined_at
            })
        
        return {
            "id": team.id,
            "tournament_id": team.tournament_id,
            "name": team.name,
            "description": team.description,
            "captain_id": team.captain_id,
            "captain_username": current_user.username,
            "is_full": team.is_full,
            "total_members": team.total_members,
            "max_members": tournament.team_size,
            "members": members,
            "created_at": team.created_at
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/tournament/{tournament_id}", response_model=List[TeamResponse])
async def get_tournament_teams(
    tournament_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all teams for a tournament.
    
    Args:
        tournament_id: Tournament ID
        
    Returns:
        List of teams
    """
    service = TeamService(db)
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    teams = service.get_tournament_teams(tournament_id)
    
    # Build response with member details
    result = []
    for team in teams:
        captain = db.query(User).filter(User.id == team.captain_id).first()
        
        members = []
        for member in team.members:
            user = db.query(User).filter(User.id == member.user_id).first()
            members.append({
                "id": member.id,
                "user_id": member.user_id,
                "username": user.username if user else "Unknown",
                "role": member.role,
                "joined_at": member.joined_at
            })
        
        result.append({
            "id": team.id,
            "tournament_id": team.tournament_id,
            "name": team.name,
            "description": team.description,
            "captain_id": team.captain_id,
            "captain_username": captain.username if captain else "Unknown",
            "is_full": team.is_full,
            "total_members": team.total_members,
            "max_members": tournament.team_size,
            "members": members,
            "created_at": team.created_at
        })
    
    return result


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: int,
    db: Session = Depends(get_db)
):
    """
    Get team details by ID.
    
    Args:
        team_id: Team ID
        
    Returns:
        Team details
    """
    service = TeamService(db)
    team = service.get_team(team_id)
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    tournament = db.query(Tournament).filter(Tournament.id == team.tournament_id).first()
    captain = db.query(User).filter(User.id == team.captain_id).first()
    
    members = []
    for member in team.members:
        user = db.query(User).filter(User.id == member.user_id).first()
        members.append({
            "id": member.id,
            "user_id": member.user_id,
            "username": user.username if user else "Unknown",
            "role": member.role,
            "joined_at": member.joined_at
        })
    
    return {
        "id": team.id,
        "tournament_id": team.tournament_id,
        "name": team.name,
        "description": team.description,
        "captain_id": team.captain_id,
        "captain_username": captain.username if captain else "Unknown",
        "is_full": team.is_full,
        "total_members": team.total_members,
        "max_members": tournament.team_size,
        "members": members,
        "created_at": team.created_at
    }


@router.post("/{team_id}/join")
async def join_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Join an existing team.
    
    Args:
        team_id: Team ID
        
    Returns:
        Success message
    """
    service = TeamService(db)
    
    try:
        member = service.join_team(team_id, current_user.id)
        return {
            "message": "Successfully joined team",
            "team_id": team_id,
            "member_id": member.id
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{team_id}/leave")
async def leave_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Leave a team.
    
    Args:
        team_id: Team ID
        
    Returns:
        Success message
    """
    service = TeamService(db)
    
    try:
        service.leave_team(team_id, current_user.id)
        return {
            "message": "Successfully left team",
            "team_id": team_id
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{team_id}/register")
async def register_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Register team for tournament (captain only).
    
    Args:
        team_id: Team ID
        
    Returns:
        Success message
    """
    service = TeamService(db)
    team = service.get_team(team_id)
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Verify user is captain
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team captain can register the team"
        )
    
    try:
        participant = service.register_team_for_tournament(team_id)
        return {
            "message": "Team successfully registered for tournament",
            "participant_id": participant.id,
            "starting_balance": participant.starting_balance
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/my-team/{tournament_id}")
async def get_my_team(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's team for a specific tournament.
    
    Args:
        tournament_id: Tournament ID
        
    Returns:
        Team details or null
    """
    service = TeamService(db)
    team = service.get_user_team(tournament_id, current_user.id)
    
    if not team:
        return None
    
    tournament = db.query(Tournament).filter(Tournament.id == team.tournament_id).first()
    captain = db.query(User).filter(User.id == team.captain_id).first()
    
    members = []
    for member in team.members:
        user = db.query(User).filter(User.id == member.user_id).first()
        members.append({
            "id": member.id,
            "user_id": member.user_id,
            "username": user.username if user else "Unknown",
            "role": member.role,
            "joined_at": member.joined_at
        })
    
    return {
        "id": team.id,
        "tournament_id": team.tournament_id,
        "name": team.name,
        "description": team.description,
        "captain_id": team.captain_id,
        "captain_username": captain.username if captain else "Unknown",
        "is_full": team.is_full,
        "total_members": team.total_members,
        "max_members": tournament.team_size,
        "members": members,
        "created_at": team.created_at
    }

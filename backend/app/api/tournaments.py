"""
Tournament API routes.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db
from app.schemas.tournament import (
    TournamentResponse, TournamentJoin,
    LeaderboardEntry, ParticipantStats
)
from app.services.tournament_service import TournamentService
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("", response_model=List[TournamentResponse])
async def get_tournaments(
    status_filter: str = Query(None, regex="^(UPCOMING|REGISTRATION_OPEN|ACTIVE|COMPLETED)$"),
    db: Session = Depends(get_db)
):
    """
    Get list of tournaments filtered by their actual time-based status.
    
    Args:
        status_filter: Optional status filter
                      - UPCOMING: tournament hasn't started yet (start_date > now)
                      - ACTIVE: tournament is currently running (start_date <= now < end_date)
                      - COMPLETED: tournament has ended (end_date <= now)
                      - None/All: Returns all tournaments
        
    Returns:
        List of tournaments with dynamically calculated status
    """
    from app.models.tournament import Tournament, TournamentStatus
    from datetime import datetime, timezone
    
    now = datetime.now(timezone.utc)
    
    # Get all tournaments first
    query = db.query(Tournament).order_by(Tournament.created_at.desc())
    
    if status_filter:
        if status_filter == 'UPCOMING':
            # Upcoming: tournament hasn't started yet (start_date > now)
            tournaments = query.filter(
                Tournament.start_date > now
            ).all()
        elif status_filter == 'ACTIVE':
            # Active: tournament has started AND hasn't ended yet (start_date <= now < end_date)
            tournaments = query.filter(
                Tournament.start_date <= now,
                Tournament.end_date > now
            ).all()
        elif status_filter == 'COMPLETED':
            # Completed: tournament has ended (end_date <= now)
            tournaments = query.filter(
                Tournament.end_date <= now
            ).all()
        else:
            tournaments = query.all()
    else:
        # Return only active and upcoming tournaments when no filter (exclude completed)
        tournaments = query.filter(
            Tournament.end_date > now
        ).all()
    
    # Calculate actual status for each tournament based on current time
    for tournament in tournaments:
        if now >= tournament.end_date:
            tournament.status = TournamentStatus.COMPLETED
        elif now >= tournament.start_date and now < tournament.end_date:
            tournament.status = TournamentStatus.ACTIVE
        elif now < tournament.registration_deadline:
            tournament.status = TournamentStatus.REGISTRATION_OPEN
        else:
            tournament.status = TournamentStatus.UPCOMING
    
    return tournaments


@router.get("/{tournament_id}", response_model=TournamentResponse)
async def get_tournament(
    tournament_id: int,
    db: Session = Depends(get_db)
):
    """
    Get tournament details by ID.
    
    Args:
        tournament_id: Tournament ID
        
    Returns:
        Tournament details
    """
    service = TournamentService(db)
    tournament = service.get_tournament_by_id(tournament_id)
    
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    return tournament


@router.post("/{tournament_id}/join")
async def join_tournament(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Join a tournament.
    
    Args:
        tournament_id: Tournament ID to join
        
    Returns:
        Success message with participant details
    """
    service = TournamentService(db)
    
    try:
        participant = service.join_tournament(tournament_id, current_user.id)
        return {
            "message": "Successfully joined tournament",
            "tournament_id": tournament_id,
            "starting_balance": participant.starting_balance
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{tournament_id}/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    tournament_id: int,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    Get tournament leaderboard.
    
    Args:
        tournament_id: Tournament ID
        limit: Maximum number of entries to return
        
    Returns:
        Leaderboard entries sorted by rank
    """
    service = TournamentService(db)
    
    # Verify tournament exists
    tournament = service.get_tournament_by_id(tournament_id)
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    rankings = service.get_leaderboard(tournament_id, limit)
    
    # Convert to LeaderboardEntry format
    leaderboard = []
    for ranking in rankings:
        from app.models.user import User
        user = db.query(User).filter(User.id == ranking.user_id).first()
        
        leaderboard.append({
            "rank": ranking.rank,
            "user_id": ranking.user_id,
            "username": user.username if user else "Unknown",
            "total_pnl": ranking.total_pnl,
            "roi": ranking.roi,
            "total_trades": ranking.total_trades,
            "win_rate": ranking.win_rate,
            "current_balance": ranking.current_balance,
            "last_updated": ranking.last_updated
        })
    
    return leaderboard


@router.get("/{tournament_id}/my-rank")
async def get_my_rank(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's rank in a tournament.
    
    Args:
        tournament_id: Tournament ID
        
    Returns:
        User's ranking details
    """
    service = TournamentService(db)
    
    ranking = service.get_user_rank(tournament_id, current_user.id)
    
    if not ranking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not participating in this tournament"
        )
    
    return {
        "rank": ranking.rank,
        "total_pnl": ranking.total_pnl,
        "roi": ranking.roi,
        "total_trades": ranking.total_trades,
        "win_rate": ranking.win_rate,
        "current_balance": ranking.current_balance,
        "last_updated": ranking.last_updated
    }


@router.get("/my/tournaments", response_model=List[TournamentResponse])
async def get_my_tournaments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get tournaments the current user is participating in.
    
    Returns:
        List of tournaments
    """
    service = TournamentService(db)
    tournaments = service.get_user_tournaments(current_user.id)
    return tournaments

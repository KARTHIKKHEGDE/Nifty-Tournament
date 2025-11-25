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
    Get list of tournaments.
    
    Args:
        status_filter: Optional status filter
        
    Returns:
        List of tournaments
    """
    service = TournamentService(db)
    
    if status_filter:
        from app.models.tournament import Tournament, TournamentStatus
        tournaments = db.query(Tournament).filter(
            Tournament.status == TournamentStatus(status_filter)
        ).all()
    else:
        tournaments = service.get_active_tournaments()
    
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

"""
Admin API routes for tournament and user management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db
from app.schemas.tournament import TournamentCreate, TournamentUpdate, TournamentResponse
from app.schemas.user import UserResponse
from app.services.tournament_service import TournamentService
from app.api.dependencies import get_current_admin_user
from app.models.user import User
from app.models.tournament import Tournament

router = APIRouter()


@router.post("/tournaments", response_model=TournamentResponse, status_code=status.HTTP_201_CREATED)
async def create_tournament(
    tournament_data: TournamentCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Create a new tournament (Admin only).
    
    Args:
        tournament_data: Tournament details
        
    Returns:
        Created tournament
    """
    service = TournamentService(db)
    tournament = service.create_tournament(tournament_data, current_user.id)
    return tournament


@router.put("/tournaments/{tournament_id}", response_model=TournamentResponse)
async def update_tournament(
    tournament_id: int,
    update_data: TournamentUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update tournament details (Admin only).
    
    Args:
        tournament_id: Tournament ID
        update_data: Fields to update
        
    Returns:
        Updated tournament
    """
    service = TournamentService(db)
    tournament = service.update_tournament(tournament_id, update_data)
    
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    return tournament


@router.post("/tournaments/{tournament_id}/start")
async def start_tournament(
    tournament_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Start a tournament (Admin only).
    
    Changes tournament status to ACTIVE.
    
    Args:
        tournament_id: Tournament ID
        
    Returns:
        Success message
    """
    service = TournamentService(db)
    success = service.start_tournament(tournament_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    return {"message": f"Tournament {tournament_id} started successfully"}


@router.post("/tournaments/{tournament_id}/end")
async def end_tournament(
    tournament_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    End a tournament (Admin only).
    
    Changes tournament status to COMPLETED and finalizes rankings.
    
    Args:
        tournament_id: Tournament ID
        
    Returns:
        Success message
    """
    service = TournamentService(db)
    success = service.end_tournament(tournament_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    return {"message": f"Tournament {tournament_id} ended successfully"}


@router.delete("/tournaments/{tournament_id}")
async def delete_tournament(
    tournament_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete a tournament (Admin only).
    
    Args:
        tournament_id: Tournament ID
        
    Returns:
        Success message
    """
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    db.delete(tournament)
    db.commit()
    
    return {"message": f"Tournament {tournament_id} deleted successfully"}


@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all users (Admin only).
    
    Returns:
        List of all users
    """
    users = db.query(User).all()
    return users


@router.put("/users/{user_id}/activate")
async def activate_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Activate a user account (Admin only).
    
    Args:
        user_id: User ID
        
    Returns:
        Success message
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    db.commit()
    
    return {"message": f"User {user_id} activated successfully"}


@router.put("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Deactivate a user account (Admin only).
    
    Args:
        user_id: User ID
        
    Returns:
        Success message
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    user.is_active = False
    db.commit()
    
    return {"message": f"User {user_id} deactivated successfully"}


@router.get("/stats")
async def get_platform_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get platform statistics (Admin only).
    
    Returns:
        Platform statistics including user count, tournament count, etc.
    """
    from app.models.paper_order import PaperOrder, OrderStatus
    from app.models.tournament import Tournament
    
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_tournaments = db.query(Tournament).count()
    active_tournaments = db.query(Tournament).filter(
        Tournament.status.in_(['REGISTRATION_OPEN', 'ACTIVE'])
    ).count()
    total_orders = db.query(PaperOrder).count()
    executed_orders = db.query(PaperOrder).filter(
        PaperOrder.status == OrderStatus.EXECUTED
    ).count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_tournaments": total_tournaments,
        "active_tournaments": active_tournaments,
        "total_orders": total_orders,
        "executed_orders": executed_orders
    }

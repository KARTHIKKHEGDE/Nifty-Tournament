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


# ==================== TOURNAMENT TRADING ENDPOINTS ====================

@router.get("/{tournament_id}/participant")
async def get_participant_status(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if user has joined a tournament and get participation details.
    
    Returns:
        joined: boolean
        participant: participant details if joined
        userId: user ID for websocket rooms
    """
    from app.models.tournament_participant import TournamentParticipant
    
    participant = db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == tournament_id,
        TournamentParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        return {"joined": False, "userId": str(current_user.id)}
    
    return {
        "joined": True,
        "userId": str(current_user.id),
        "participant": {
            "id": participant.id,
            "user_id": participant.user_id,
            "tournament_id": participant.tournament_id,
            "joined_at": participant.joined_at.isoformat(),
            "initial_balance": participant.initial_balance,
            "current_balance": participant.current_balance,
            "rank": participant.rank,
            "pnl": participant.pnl,
            "is_active": participant.is_active
        }
    }


@router.get("/{tournament_id}/pnl")
async def get_tournament_pnl(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's P&L within tournament.
    
    Returns:
        unrealised: P&L from open positions
        realised: P&L from closed positions
        total: Total P&L
    """
    from app.models.tournament_participant import TournamentParticipant
    from app.models.paper_position import PaperPosition
    from app.models.paper_order import PaperOrder
    
    # Verify participant
    participant = db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == tournament_id,
        TournamentParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not participating in this tournament"
        )
    
    # Calculate unrealised P&L from open positions
    open_positions = db.query(PaperPosition).filter(
        PaperPosition.user_id == current_user.id,
        PaperPosition.tournament_id == tournament_id,
        PaperPosition.quantity != 0
    ).all()
    
    unrealised_pnl = sum(p.unrealized_pnl or 0 for p in open_positions)
    
    # Calculate realised P&L from closed orders
    filled_orders = db.query(PaperOrder).filter(
        PaperOrder.user_id == current_user.id,
        PaperOrder.tournament_id == tournament_id,
        PaperOrder.status == "FILLED"
    ).all()
    
    realised_pnl = sum(o.realized_pnl or 0 for o in filled_orders)
    
    total_pnl = unrealised_pnl + realised_pnl
    
    return {
        "unrealised": unrealised_pnl,
        "realised": realised_pnl,
        "total": total_pnl
    }


@router.get("/{tournament_id}/positions")
async def get_tournament_positions(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's positions within tournament.
    """
    from app.models.tournament_participant import TournamentParticipant
    from app.models.paper_position import PaperPosition
    
    # Verify participant
    participant = db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == tournament_id,
        TournamentParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not participating in this tournament"
        )
    
    positions = db.query(PaperPosition).filter(
        PaperPosition.user_id == current_user.id,
        PaperPosition.tournament_id == tournament_id,
        PaperPosition.quantity != 0
    ).all()
    
    return positions


@router.get("/{tournament_id}/orders")
async def get_tournament_orders(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's orders within tournament.
    """
    from app.models.tournament_participant import TournamentParticipant
    from app.models.paper_order import PaperOrder
    
    # Verify participant
    participant = db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == tournament_id,
        TournamentParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not participating in this tournament"
        )
    
    orders = db.query(PaperOrder).filter(
        PaperOrder.user_id == current_user.id,
        PaperOrder.tournament_id == tournament_id
    ).order_by(PaperOrder.created_at.desc()).all()
    
    return orders


@router.post("/{tournament_id}/orders")
async def place_tournament_order(
    tournament_id: int,
    order_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Place an order within tournament.
    """
    from app.models.tournament_participant import TournamentParticipant
    from app.models.paper_order import PaperOrder
    from app.models.tournament import Tournament
    from datetime import datetime, timezone
    
    # Verify participant
    participant = db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == tournament_id,
        TournamentParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not participating in this tournament"
        )
    
    # Verify tournament is active
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    now = datetime.now(timezone.utc)
    if now < tournament.start_date or now > tournament.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tournament is not currently active"
        )
    
    # Create order with tournament_id
    order = PaperOrder(
        user_id=current_user.id,
        tournament_id=tournament_id,
        symbol=order_data.get("symbol"),
        instrument_type=order_data.get("instrument_type"),
        order_type=order_data.get("order_type"),
        order_side=order_data.get("order_side"),
        quantity=order_data.get("quantity"),
        price=order_data.get("price"),
        stop_loss=order_data.get("stop_loss"),
        take_profit=order_data.get("take_profit"),
        status="PENDING",
        created_at=now
    )
    
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # Simulate order fill (in production, this would be handled by matching engine)
    order.status = "FILLED"
    order.average_price = order.price or order_data.get("current_price", 0)
    order.filled_quantity = order.quantity
    db.commit()
    
    return order


@router.delete("/{tournament_id}/orders/{order_id}")
async def cancel_tournament_order(
    tournament_id: int,
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel an order within tournament.
    """
    from app.models.paper_order import PaperOrder
    
    order = db.query(PaperOrder).filter(
        PaperOrder.id == order_id,
        PaperOrder.user_id == current_user.id,
        PaperOrder.tournament_id == tournament_id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.status not in ["PENDING", "OPEN"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order cannot be cancelled"
        )
    
    order.status = "CANCELLED"
    db.commit()
    
    return {"message": "Order cancelled successfully"}


@router.delete("/{tournament_id}/positions/{position_id}")
async def close_tournament_position(
    tournament_id: int,
    position_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Close a position within tournament.
    """
    from app.models.paper_position import PaperPosition
    
    position = db.query(PaperPosition).filter(
        PaperPosition.id == position_id,
        PaperPosition.user_id == current_user.id,
        PaperPosition.tournament_id == tournament_id
    ).first()
    
    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Position not found"
        )
    
    # Close position by setting quantity to 0
    position.quantity = 0
    db.commit()
    
    return {"message": "Position closed successfully"}

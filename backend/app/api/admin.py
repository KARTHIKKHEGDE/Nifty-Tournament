"""
Admin API routes for tournament and user management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.db import get_db
from app.schemas.tournament import TournamentCreate, TournamentUpdate, TournamentResponse
from app.schemas.user import UserResponse
from app.schemas.admin import (
    DashboardOverviewResponse,
    RecentActivityResponse,
    TopPerformersResponse,
    TournamentAnalyticsResponse,
    TournamentParticipantsResponse,
    UserAnalyticsResponse,
    UserTournamentHistory,
    RevenueAnalyticsResponse,
    UserGrowthMetrics,
    TournamentPerformanceMetrics,
    BulkNotificationRequest,
    BulkNotificationResponse,
    ExportDataRequest,
    ExportDataResponse,
    AdminActionListResponse,
    UserDetailResponse,
    UserListResponse,
    UpdateUserRequest,
    RemoveParticipantRequest,
    RemoveParticipantResponse,
    AddParticipantRequest,
    AddParticipantResponse
)
from app.services.tournament_service import TournamentService
from app.services.admin_service import AdminService
from app.services.analytics_service import AnalyticsService
from app.api.dependencies import get_current_admin_user
from app.models.user import User
from app.models.tournament import Tournament, TournamentStatus
from app.models.admin_action import AdminAction
from app.utils.logger import setup_logger

logger = setup_logger(__name__)
router = APIRouter()


# ============================================================================
# Dashboard Endpoints
# ============================================================================

@router.get("/dashboard/overview", response_model=DashboardOverviewResponse)
async def get_dashboard_overview(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive dashboard overview.
    
    Returns platform statistics including user count, tournament count,
    revenue, and other key metrics.
    """
    service = AdminService(db)
    overview = service.get_dashboard_overview()
    
    # Log admin action
    service.log_admin_action(
        admin_user_id=current_user.id,
        action_type="VIEW_DASHBOARD",
        target_type="DASHBOARD",
        description=f"Admin {current_user.username} viewed dashboard overview"
    )
    
    return overview


@router.get("/dashboard/recent-activity", response_model=RecentActivityResponse)
async def get_recent_activity(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get recent platform activity.
    
    Returns recent admin actions and platform events.
    """
    service = AdminService(db)
    activity = service.get_recent_activity(limit=limit, offset=offset)
    return activity


@router.get("/dashboard/top-performers", response_model=TopPerformersResponse)
async def get_top_performers(
    metric: str = Query("pnl", regex="^(pnl|win_rate|roi|trades)$"),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get top performing users.
    
    Args:
        metric: Metric to rank by (pnl, win_rate, roi, trades)
        limit: Number of top performers
    """
    service = AdminService(db)
    performers = service.get_top_performers(metric=metric, limit=limit)
    
    return {
        "performers": performers,
        "metric": metric,
        "limit": limit
    }


# ============================================================================
# Tournament Management Endpoints
# ============================================================================

@router.post("/tournaments", response_model=TournamentResponse, status_code=status.HTTP_201_CREATED)
async def create_tournament(
    tournament_data: TournamentCreate,
    request: Request,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Create a new tournament (Admin only).
    """
    service = TournamentService(db)
    admin_service = AdminService(db)
    
    tournament = service.create_tournament(tournament_data, current_user.id)
    
    # Log admin action
    admin_service.log_admin_action(
        admin_user_id=current_user.id,
        action_type="CREATE_TOURNAMENT",
        target_type="TOURNAMENT",
        target_id=tournament.id,
        description=f"Created tournament '{tournament.name}'",
        action_metadata={"tournament_id": tournament.id, "prize_pool": tournament.prize_pool},
        ip_address=request.client.host if request.client else None
    )
    
    return tournament


@router.get("/tournaments", response_model=List[TournamentResponse])
async def get_all_tournaments(
    status_filter: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all tournaments with optional filters (uses real-time status calculation).
    """
    from datetime import datetime, timezone
    
    now = datetime.now(timezone.utc)
    query = db.query(Tournament)
    
    # Apply time-based filtering like the public API
    if status_filter:
        if status_filter == 'UPCOMING':
            query = query.filter(Tournament.start_date > now)
        elif status_filter == 'ACTIVE':
            query = query.filter(
                Tournament.start_date <= now,
                Tournament.end_date > now
            )
        elif status_filter == 'COMPLETED':
            query = query.filter(Tournament.end_date <= now)
        elif status_filter == 'REGISTRATION_OPEN':
            query = query.filter(
                Tournament.registration_deadline > now,
                Tournament.start_date > now
            )
        else:
            # For other statuses, use the database status field
            try:
                status_enum = TournamentStatus(status_filter)
                query = query.filter(Tournament.status == status_enum)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status: {status_filter}"
                )
    
    tournaments = query.order_by(Tournament.created_at.desc()).limit(limit).offset(offset).all()
    
    # Update status for each tournament based on current time
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


@router.get("/tournaments/{tournament_id}", response_model=TournamentResponse)
async def get_tournament_details(
    tournament_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed tournament information.
    """
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    return tournament


@router.put("/tournaments/{tournament_id}", response_model=TournamentResponse)
async def update_tournament(
    tournament_id: int,
    update_data: TournamentUpdate,
    request: Request,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update tournament details (Admin only).
    """
    service = TournamentService(db)
    admin_service = AdminService(db)
    
    tournament = service.update_tournament(tournament_id, update_data)
    
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    # Log admin action
    admin_service.log_admin_action(
        admin_user_id=current_user.id,
        action_type="UPDATE_TOURNAMENT",
        target_type="TOURNAMENT",
        target_id=tournament_id,
        description=f"Updated tournament '{tournament.name}'",
        action_metadata={"tournament_id": tournament_id, "updates": update_data.dict(exclude_unset=True)},
        ip_address=request.client.host if request.client else None
    )
    
    return tournament


@router.post("/tournaments/{tournament_id}/start")
async def start_tournament(
    tournament_id: int,
    request: Request,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Start a tournament (Admin only).
    """
    service = TournamentService(db)
    admin_service = AdminService(db)
    
    success = service.start_tournament(tournament_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    # Log admin action
    admin_service.log_admin_action(
        admin_user_id=current_user.id,
        action_type="START_TOURNAMENT",
        target_type="TOURNAMENT",
        target_id=tournament_id,
        description=f"Started tournament ID {tournament_id}",
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": f"Tournament {tournament_id} started successfully"}


@router.post("/tournaments/{tournament_id}/end")
async def end_tournament(
    tournament_id: int,
    request: Request,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    End a tournament (Admin only).
    """
    service = TournamentService(db)
    admin_service = AdminService(db)
    
    success = service.end_tournament(tournament_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    # Log admin action
    admin_service.log_admin_action(
        admin_user_id=current_user.id,
        action_type="END_TOURNAMENT",
        target_type="TOURNAMENT",
        target_id=tournament_id,
        description=f"Ended tournament ID {tournament_id}",
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": f"Tournament {tournament_id} ended successfully"}


@router.delete("/tournaments/{tournament_id}")
async def delete_tournament(
    tournament_id: int,
    request: Request,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete a tournament (Admin only).
    """
    admin_service = AdminService(db)
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    tournament_name = tournament.name
    db.delete(tournament)
    db.commit()
    
    # Log admin action
    admin_service.log_admin_action(
        admin_user_id=current_user.id,
        action_type="DELETE_TOURNAMENT",
        target_type="TOURNAMENT",
        target_id=tournament_id,
        description=f"Deleted tournament '{tournament_name}'",
        action_metadata={"tournament_id": tournament_id, "tournament_name": tournament_name},
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": f"Tournament {tournament_id} deleted successfully"}


@router.get("/tournaments/{tournament_id}/analytics", response_model=TournamentAnalyticsResponse)
async def get_tournament_analytics(
    tournament_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed tournament analytics.
    """
    service = AdminService(db)
    analytics = service.get_tournament_analytics(tournament_id)
    
    if not analytics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    return analytics


@router.get("/tournaments/{tournament_id}/participants", response_model=TournamentParticipantsResponse)
async def get_tournament_participants(
    tournament_id: int,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all participants in a tournament.
    """
    service = AdminService(db)
    participants = service.get_tournament_participants(tournament_id, limit=limit, offset=offset)
    return participants


@router.delete("/tournaments/{tournament_id}/participants/{user_id}", response_model=RemoveParticipantResponse)
async def remove_participant(
    tournament_id: int,
    user_id: int,
    request: Request,
    remove_data: Optional[RemoveParticipantRequest] = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Remove a participant from a tournament.
    """
    service = AdminService(db)
    
    reason = remove_data.reason if remove_data else None
    success = service.remove_participant_from_tournament(
        tournament_id=tournament_id,
        user_id=user_id,
        admin_user_id=current_user.id,
        reason=reason
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found"
        )
    
    return RemoveParticipantResponse(
        success=True,
        message=f"Participant {user_id} removed from tournament {tournament_id}",
        tournament_id=tournament_id,
        user_id=user_id
    )


@router.post("/tournaments/{tournament_id}/participants", response_model=AddParticipantResponse)
async def add_participant(
    tournament_id: int,
    add_data: AddParticipantRequest,
    request: Request,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Manually add a participant to a tournament.
    """
    service = AdminService(db)
    
    participant = service.add_participant_to_tournament(
        tournament_id=tournament_id,
        user_id=add_data.user_id,
        admin_user_id=current_user.id,
        starting_balance=add_data.starting_balance
    )
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to add participant. Tournament or user not found, or user already participating."
        )
    
    return AddParticipantResponse(
        success=True,
        message=f"Participant {add_data.user_id} added to tournament {tournament_id}",
        participant_id=participant.id
    )


# ============================================================================
# User Management Endpoints
# ============================================================================

@router.get("/users", response_model=UserListResponse)
async def get_all_users(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    is_active: Optional[bool] = Query(None),
    is_admin: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all users with optional filters.
    """
    query = db.query(User)
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    if is_admin is not None:
        query = query.filter(User.is_admin == is_admin)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (User.email.ilike(search_pattern)) | (User.username.ilike(search_pattern))
        )
    
    total_count = query.count()
    users = query.order_by(User.created_at.desc()).limit(limit).offset(offset).all()
    
    # Get additional stats for each user
    user_details = []
    for user in users:
        from app.models.wallet import Wallet
        from app.models.tournament_participant import TournamentParticipant
        from app.models.paper_order import PaperOrder
        
        wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
        tournaments_joined = db.query(TournamentParticipant).filter(
            TournamentParticipant.user_id == user.id
        ).count()
        total_trades = db.query(PaperOrder).filter(PaperOrder.user_id == user.id).count()
        total_pnl = db.query(func.sum(TournamentParticipant.total_pnl)).filter(
            TournamentParticipant.user_id == user.id
        ).scalar() or 0.0
        
        user_details.append(UserDetailResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            is_active=user.is_active,
            is_admin=user.is_admin,
            created_at=user.created_at,
            updated_at=user.updated_at,
            current_balance=wallet.balance if wallet else 0.0,
            tournaments_joined=tournaments_joined,
            total_trades=total_trades,
            total_pnl=total_pnl
        ))
    
    return UserListResponse(
        users=user_details,
        total_count=total_count,
        page=offset // limit + 1 if limit > 0 else 1,
        page_size=limit
    )


@router.get("/users/{user_id}", response_model=UserAnalyticsResponse)
async def get_user_details(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed user information and analytics.
    """
    service = AdminService(db)
    analytics = service.get_user_analytics(user_id)
    
    if not analytics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return analytics


@router.get("/users/{user_id}/tournaments", response_model=List[UserTournamentHistory])
async def get_user_tournaments(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get user's tournament history.
    """
    service = AdminService(db)
    history = service.get_user_tournament_history(user_id)
    return history


@router.put("/users/{user_id}/activate")
async def activate_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Activate a user account (Admin only).
    """
    admin_service = AdminService(db)
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    db.commit()
    
    # Log admin action
    admin_service.log_admin_action(
        admin_user_id=current_user.id,
        action_type="ACTIVATE_USER",
        target_type="USER",
        target_id=user_id,
        description=f"Activated user {user.username}",
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": f"User {user_id} activated successfully"}


@router.put("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Deactivate a user account (Admin only).
    """
    admin_service = AdminService(db)
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
    
    # Log admin action
    admin_service.log_admin_action(
        admin_user_id=current_user.id,
        action_type="DEACTIVATE_USER",
        target_type="USER",
        target_id=user_id,
        description=f"Deactivated user {user.username}",
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": f"User {user_id} deactivated successfully"}


@router.put("/users/{user_id}/make-admin")
async def make_admin(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Grant admin privileges to a user.
    """
    admin_service = AdminService(db)
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_admin = True
    db.commit()
    
    # Log admin action
    admin_service.log_admin_action(
        admin_user_id=current_user.id,
        action_type="GRANT_ADMIN",
        target_type="USER",
        target_id=user_id,
        description=f"Granted admin privileges to user {user.username}",
        ip_address=request.client.host if request.client else None
    )
    
    # Send notification
    admin_service.create_notification(
        user_id=user_id,
        title="Admin Privileges Granted",
        message="You have been granted admin privileges on the platform.",
        type="SUCCESS"
    )
    
    return {"message": f"User {user_id} is now an admin"}


@router.put("/users/{user_id}/revoke-admin")
async def revoke_admin(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Revoke admin privileges from a user.
    """
    admin_service = AdminService(db)
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot revoke your own admin privileges"
        )
    
    user.is_admin = False
    db.commit()
    
    # Log admin action
    admin_service.log_admin_action(
        admin_user_id=current_user.id,
        action_type="REVOKE_ADMIN",
        target_type="USER",
        target_id=user_id,
        description=f"Revoked admin privileges from user {user.username}",
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": f"Admin privileges revoked from user {user_id}"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete a user account (Admin only).
    """
    admin_service = AdminService(db)
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    username = user.username
    email = user.email
    
    db.delete(user)
    db.commit()
    
    # Log admin action
    admin_service.log_admin_action(
        admin_user_id=current_user.id,
        action_type="DELETE_USER",
        target_type="USER",
        target_id=user_id,
        description=f"Deleted user {username} ({email})",
        action_metadata={"user_id": user_id, "username": username, "email": email},
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": f"User {user_id} deleted successfully"}


# ============================================================================
# Analytics Endpoints
# ============================================================================

@router.get("/analytics/revenue", response_model=RevenueAnalyticsResponse)
async def get_revenue_analytics(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get revenue analytics.
    """
    service = AnalyticsService(db)
    analytics = service.calculate_revenue_metrics()
    return analytics


@router.get("/analytics/user-growth", response_model=UserGrowthMetrics)
async def get_user_growth(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get user growth metrics.
    """
    service = AnalyticsService(db)
    metrics = service.calculate_user_growth()
    return metrics


@router.get("/analytics/tournament-performance", response_model=TournamentPerformanceMetrics)
async def get_tournament_performance(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get tournament performance metrics.
    """
    service = AnalyticsService(db)
    metrics = service.calculate_tournament_performance()
    return metrics


@router.get("/analytics/trading-volume")
async def get_trading_volume(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get trading volume statistics.
    """
    service = AnalyticsService(db)
    stats = service.get_trading_volume_stats()
    return stats


@router.get("/analytics/user-engagement")
async def get_user_engagement(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get user engagement metrics.
    """
    service = AnalyticsService(db)
    metrics = service.get_user_engagement_metrics()
    return metrics


# ============================================================================
# Bulk Operations Endpoints
# ============================================================================

@router.post("/bulk/send-notification", response_model=BulkNotificationResponse)
async def send_bulk_notification(
    notification_data: BulkNotificationRequest,
    request: Request,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Send notification to multiple users.
    """
    service = AdminService(db)
    
    result = service.send_bulk_notification(
        user_ids=notification_data.user_ids,
        title=notification_data.title,
        message=notification_data.message,
        type=notification_data.type,
        action_url=notification_data.action_url
    )
    
    # Log admin action
    service.log_admin_action(
        admin_user_id=current_user.id,
        action_type="BULK_NOTIFICATION",
        target_type="NOTIFICATION",
        description=f"Sent bulk notification to {len(notification_data.user_ids)} users",
        action_metadata={"user_count": len(notification_data.user_ids), "title": notification_data.title},
        ip_address=request.client.host if request.client else None
    )
    
    return result


# ============================================================================
# Admin Action Audit Log
# ============================================================================

@router.get("/audit-log", response_model=AdminActionListResponse)
async def get_audit_log(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    action_type: Optional[str] = Query(None),
    admin_user_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get admin action audit log.
    """
    query = db.query(AdminAction)
    
    if action_type:
        query = query.filter(AdminAction.action_type == action_type)
    
    if admin_user_id:
        query = query.filter(AdminAction.admin_user_id == admin_user_id)
    
    total_count = query.count()
    actions = query.order_by(AdminAction.created_at.desc()).limit(limit).offset(offset).all()
    
    # Add admin username to each action
    action_responses = []
    for action in actions:
        admin_user = db.query(User).filter(User.id == action.admin_user_id).first()
        action_responses.append({
            "id": action.id,
            "admin_user_id": action.admin_user_id,
            "admin_username": admin_user.username if admin_user else "Unknown",
            "action_type": action.action_type,
            "target_type": action.target_type,
            "target_id": action.target_id,
            "description": action.description,
            "metadata": action.action_metadata,
            "ip_address": action.ip_address,
            "created_at": action.created_at
        })
    
    return AdminActionListResponse(
        actions=action_responses,
        total_count=total_count,
        page=offset // limit + 1 if limit > 0 else 1,
        page_size=limit
    )


# ============================================================================
# Platform Statistics (Legacy - kept for compatibility)
# ============================================================================

@router.get("/stats")
async def get_platform_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get platform statistics (Admin only).
    
    Legacy endpoint - use /dashboard/overview for more comprehensive data.
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

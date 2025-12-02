"""
Admin schemas for dashboard, analytics, and administrative operations.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.tournament import TournamentStatus


# ============================================================================
# Dashboard Schemas
# ============================================================================

class DashboardOverviewResponse(BaseModel):
    """Schema for admin dashboard overview."""
    total_users: int
    active_users: int
    total_tournaments: int
    active_tournaments: int
    completed_tournaments: int
    total_participants: int
    total_orders: int
    executed_orders: int
    total_revenue: float
    platform_balance: float
    
    class Config:
        from_attributes = True


class RecentActivityItem(BaseModel):
    """Schema for a single activity item."""
    id: int
    type: str  # USER_JOINED, TOURNAMENT_CREATED, ORDER_EXECUTED, etc.
    description: str
    user_id: Optional[int]
    username: Optional[str]
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class RecentActivityResponse(BaseModel):
    """Schema for recent activity feed."""
    activities: List[RecentActivityItem]
    total_count: int
    page: int
    page_size: int


class TopPerformer(BaseModel):
    """Schema for top performer."""
    user_id: int
    username: str
    email: str
    metric_value: float  # Could be total_pnl, win_rate, etc.
    metric_name: str
    tournaments_joined: int
    total_trades: int
    
    class Config:
        from_attributes = True


class TopPerformersResponse(BaseModel):
    """Schema for top performers list."""
    performers: List[TopPerformer]
    metric: str  # pnl, win_rate, roi, etc.
    limit: int


# ============================================================================
# Tournament Analytics Schemas
# ============================================================================

class TournamentAnalyticsResponse(BaseModel):
    """Schema for detailed tournament analytics."""
    tournament_id: int
    tournament_name: str
    status: TournamentStatus
    
    # Participation metrics
    total_participants: int
    active_participants: int
    avg_trades_per_participant: float
    
    # Trading metrics
    total_trades: int
    total_volume: float
    avg_trade_size: float
    
    # Performance metrics
    total_pnl: float
    avg_pnl: float
    top_pnl: float
    worst_pnl: float
    
    # Distribution
    profitable_participants: int
    losing_participants: int
    break_even_participants: int
    
    # Time metrics
    start_date: datetime
    end_date: datetime
    days_remaining: Optional[int]
    
    class Config:
        from_attributes = True


class ParticipantDetail(BaseModel):
    """Schema for participant details in admin view."""
    id: int
    user_id: int
    username: str
    email: str
    starting_balance: float
    current_balance: float
    total_pnl: float
    roi: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    rank: Optional[int]
    joined_at: datetime
    last_trade_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class TournamentParticipantsResponse(BaseModel):
    """Schema for tournament participants list."""
    tournament_id: int
    participants: List[ParticipantDetail]
    total_count: int
    page: int
    page_size: int


# ============================================================================
# User Analytics Schemas
# ============================================================================

class UserAnalyticsResponse(BaseModel):
    """Schema for detailed user analytics."""
    user_id: int
    username: str
    email: str
    is_active: bool
    is_admin: bool
    created_at: datetime
    
    # Tournament stats
    tournaments_joined: int
    tournaments_completed: int
    active_tournaments: int
    
    # Trading stats
    total_trades: int
    total_volume: float
    total_pnl: float
    avg_pnl_per_trade: float
    win_rate: float
    
    # Financial stats
    current_balance: float
    total_winnings: float
    total_entry_fees_paid: float
    
    # Rankings
    best_rank: Optional[int]
    avg_rank: Optional[float]
    
    class Config:
        from_attributes = True


class UserTournamentHistory(BaseModel):
    """Schema for user's tournament history."""
    tournament_id: int
    tournament_name: str
    status: TournamentStatus
    rank: Optional[int]
    total_pnl: float
    roi: float
    total_trades: int
    joined_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Analytics Schemas
# ============================================================================

class RevenueAnalyticsResponse(BaseModel):
    """Schema for revenue analytics."""
    total_revenue: float
    total_entry_fees: float
    total_prizes_distributed: float
    net_revenue: float
    
    # Time-based metrics
    revenue_today: float
    revenue_this_week: float
    revenue_this_month: float
    
    # Growth metrics
    revenue_growth_rate: float  # Percentage
    
    # By tournament
    revenue_by_tournament: List[Dict[str, Any]]
    
    class Config:
        from_attributes = True


class UserGrowthMetrics(BaseModel):
    """Schema for user growth metrics."""
    total_users: int
    new_users_today: int
    new_users_this_week: int
    new_users_this_month: int
    
    # Growth rate
    growth_rate: float  # Percentage
    
    # Activity metrics
    active_users_today: int
    active_users_this_week: int
    active_users_this_month: int
    
    # Retention
    retention_rate: float  # Percentage
    
    # Time series data
    daily_signups: List[Dict[str, Any]]
    
    class Config:
        from_attributes = True


class TournamentPerformanceMetrics(BaseModel):
    """Schema for tournament performance metrics."""
    total_tournaments: int
    active_tournaments: int
    completed_tournaments: int
    
    # Participation metrics
    avg_participants_per_tournament: float
    total_participants_all_time: int
    
    # Engagement metrics
    avg_trades_per_tournament: float
    avg_volume_per_tournament: float
    
    # Popular tournaments
    most_popular_tournaments: List[Dict[str, Any]]
    
    # Completion rate
    completion_rate: float  # Percentage
    
    class Config:
        from_attributes = True


# ============================================================================
# Bulk Operations Schemas
# ============================================================================

class BulkNotificationRequest(BaseModel):
    """Schema for sending bulk notifications."""
    user_ids: List[int] = Field(..., min_items=1)
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)
    type: str = Field(default="INFO")
    action_url: Optional[str] = None


class BulkNotificationResponse(BaseModel):
    """Schema for bulk notification response."""
    success: bool
    notifications_sent: int
    failed_user_ids: List[int]
    message: str


class ExportDataRequest(BaseModel):
    """Schema for data export request."""
    export_type: str  # users, tournaments, trades, participants
    format: str = Field(default="csv")  # csv, json, excel
    filters: Optional[Dict[str, Any]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None


class ExportDataResponse(BaseModel):
    """Schema for data export response."""
    success: bool
    file_url: Optional[str]
    file_name: str
    record_count: int
    message: str


# ============================================================================
# Admin Action Schemas
# ============================================================================

class AdminActionResponse(BaseModel):
    """Schema for admin action audit log."""
    id: int
    admin_user_id: int
    admin_username: Optional[str]
    action_type: str
    target_type: str
    target_id: Optional[int]
    description: str
    metadata: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class AdminActionListResponse(BaseModel):
    """Schema for admin actions list."""
    actions: List[AdminActionResponse]
    total_count: int
    page: int
    page_size: int


# ============================================================================
# User Management Schemas
# ============================================================================

class UserDetailResponse(BaseModel):
    """Schema for detailed user information."""
    id: int
    email: str
    username: str
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime
    
    # Wallet info
    current_balance: float
    
    # Stats
    tournaments_joined: int
    total_trades: int
    total_pnl: float
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Schema for users list."""
    users: List[UserDetailResponse]
    total_count: int
    page: int
    page_size: int


class UpdateUserRequest(BaseModel):
    """Schema for updating user."""
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None


# ============================================================================
# Tournament Management Schemas
# ============================================================================

class TournamentListFilters(BaseModel):
    """Schema for tournament list filters."""
    status: Optional[TournamentStatus] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    min_prize_pool: Optional[float] = None
    max_prize_pool: Optional[float] = None
    search: Optional[str] = None


class RemoveParticipantRequest(BaseModel):
    """Schema for removing participant."""
    reason: Optional[str] = None


class RemoveParticipantResponse(BaseModel):
    """Schema for remove participant response."""
    success: bool
    message: str
    tournament_id: int
    user_id: int


class AddParticipantRequest(BaseModel):
    """Schema for manually adding participant."""
    user_id: int
    starting_balance: Optional[float] = None


class AddParticipantResponse(BaseModel):
    """Schema for add participant response."""
    success: bool
    message: str
    participant_id: int

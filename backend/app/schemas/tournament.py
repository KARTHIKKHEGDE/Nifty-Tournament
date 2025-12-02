"""
Tournament schemas for competitions and leaderboard.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from app.models.tournament import TournamentStatus, TournamentType
from app.models.team_member import MemberRole


class TournamentCreate(BaseModel):
    """Schema for creating a tournament."""
    name: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    tournament_type: TournamentType = Field(default=TournamentType.SOLO)
    team_size: Optional[int] = Field(None, gt=1, le=10)  # Required for TEAM tournaments
    entry_fee: float = Field(default=0.0, ge=0)
    prize_pool: float = Field(..., gt=0)
    starting_balance: float = Field(default=100000.0, gt=0)
    max_participants: Optional[int] = Field(None, gt=0)
    start_date: datetime
    end_date: datetime
    registration_deadline: datetime
    rules: Optional[str] = None
    
    @validator('team_size')
    def validate_team_size(cls, v, values):
        """Validate that team_size is provided for TEAM tournaments."""
        if 'tournament_type' in values and values['tournament_type'] == TournamentType.TEAM:
            if v is None:
                raise ValueError('team_size is required for TEAM tournaments')
        return v
    
    @validator('end_date')
    def validate_end_date(cls, v, values):
        """Validate that end_date is after start_date."""
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v
    
    @validator('registration_deadline')
    def validate_registration_deadline(cls, v, values):
        """Validate that registration_deadline is before start_date."""
        if 'start_date' in values and v >= values['start_date']:
            raise ValueError('registration_deadline must be before start_date')
        return v


class TournamentUpdate(BaseModel):
    """Schema for updating a tournament."""
    name: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = None
    status: Optional[TournamentStatus] = None
    entry_fee: Optional[float] = Field(None, ge=0)
    prize_pool: Optional[float] = Field(None, gt=0)
    max_participants: Optional[int] = Field(None, gt=0)
    registration_deadline: Optional[datetime] = None
    rules: Optional[str] = None


class TournamentResponse(BaseModel):
    """Schema for tournament response."""
    id: int
    name: str
    description: Optional[str]
    status: TournamentStatus
    tournament_type: TournamentType
    team_size: Optional[int]
    entry_fee: float
    prize_pool: float
    starting_balance: float
    max_participants: Optional[int]
    current_participants: int
    start_date: datetime
    end_date: datetime
    registration_deadline: datetime
    rules: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class TournamentJoin(BaseModel):
    """Schema for joining a tournament."""
    tournament_id: int


class LeaderboardEntry(BaseModel):
    """Schema for leaderboard entry."""
    rank: int
    user_id: int
    username: str
    total_pnl: float
    roi: float
    total_trades: int
    win_rate: float
    current_balance: float
    last_updated: datetime
    
    class Config:
        from_attributes = True


class LeaderboardResponse(BaseModel):
    """Schema for leaderboard response."""
    tournament_id: int
    tournament_name: str
    entries: List[LeaderboardEntry]
    total_participants: int
    last_updated: datetime


class ParticipantStats(BaseModel):
    """Schema for participant statistics."""
    tournament_id: int
    user_id: int
    starting_balance: float
    current_balance: float
    total_pnl: float
    roi: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    rank: Optional[int] = None
    joined_at: datetime
    
    class Config:
        from_attributes = True


class PrizeDistributionResponse(BaseModel):
    """Schema for prize distribution response."""
    id: int
    tournament_id: int
    user_id: int
    rank: int
    prize_amount: float
    payment_status: str
    payment_method: Optional[str]
    payment_reference: Optional[str]
    paid_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Team Schemas
class TeamCreate(BaseModel):
    """Schema for creating a team."""
    tournament_id: int
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None


class TeamUpdate(BaseModel):
    """Schema for updating a team."""
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = None


class TeamMemberResponse(BaseModel):
    """Schema for team member response."""
    id: int
    user_id: int
    username: str
    role: MemberRole
    joined_at: datetime
    
    class Config:
        from_attributes = True


class TeamResponse(BaseModel):
    """Schema for team response."""
    id: int
    tournament_id: int
    name: str
    description: Optional[str]
    captain_id: int
    captain_username: str
    is_full: bool
    total_members: int
    max_members: int
    members: List[TeamMemberResponse] = []
    created_at: datetime
    
    class Config:
        from_attributes = True


class TeamJoinRequest(BaseModel):
    """Schema for joining a team."""
    team_id: int


class TeamInviteRequest(BaseModel):
    """Schema for inviting a user to team."""
    user_id: int
    team_id: int


class TeamLeaderboardEntry(BaseModel):
    """Schema for team leaderboard entry."""
    rank: int
    team_id: int
    team_name: str
    total_pnl: float
    roi: float
    total_trades: int
    win_rate: float
    current_balance: float
    members_count: int
    last_updated: datetime
    
    class Config:
        from_attributes = True

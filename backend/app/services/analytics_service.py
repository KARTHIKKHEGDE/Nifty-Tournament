"""
Analytics service for calculating platform metrics and statistics.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from typing import Dict, Any, List
from datetime import datetime, timedelta

from app.models.user import User
from app.models.tournament import Tournament, TournamentStatus
from app.models.tournament_participant import TournamentParticipant
from app.models.paper_order import PaperOrder, OrderStatus
from app.models.prize_distribution import PrizeDistribution
from app.schemas.admin import (
    RevenueAnalyticsResponse,
    UserGrowthMetrics,
    TournamentPerformanceMetrics
)
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class AnalyticsService:
    """Service for analytics and metrics calculation."""
    
    def __init__(self, db: Session):
        """
        Initialize analytics service.
        
        Args:
            db: Database session
        """
        self.db = db
    
    # ========================================================================
    # Revenue Analytics
    # ========================================================================
    
    def calculate_revenue_metrics(self) -> RevenueAnalyticsResponse:
        """
        Calculate comprehensive revenue metrics.
        
        Returns:
            Revenue analytics data
        """
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=now.weekday())
        month_start = today_start.replace(day=1)
        
        # Total revenue from entry fees
        total_entry_fees = self.db.query(
            func.sum(Tournament.entry_fee * Tournament.current_participants)
        ).scalar() or 0.0
        
        # Total prizes distributed
        total_prizes_distributed = self.db.query(
            func.sum(PrizeDistribution.prize_amount)
        ).filter(PrizeDistribution.payment_status == "PAID").scalar() or 0.0
        
        # Net revenue
        net_revenue = total_entry_fees - total_prizes_distributed
        
        # Revenue today
        revenue_today = self.db.query(
            func.sum(Tournament.entry_fee * Tournament.current_participants)
        ).filter(Tournament.created_at >= today_start).scalar() or 0.0
        
        # Revenue this week
        revenue_this_week = self.db.query(
            func.sum(Tournament.entry_fee * Tournament.current_participants)
        ).filter(Tournament.created_at >= week_start).scalar() or 0.0
        
        # Revenue this month
        revenue_this_month = self.db.query(
            func.sum(Tournament.entry_fee * Tournament.current_participants)
        ).filter(Tournament.created_at >= month_start).scalar() or 0.0
        
        # Calculate growth rate (month over month)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)
        revenue_last_month = self.db.query(
            func.sum(Tournament.entry_fee * Tournament.current_participants)
        ).filter(
            and_(
                Tournament.created_at >= last_month_start,
                Tournament.created_at < month_start
            )
        ).scalar() or 0.0
        
        revenue_growth_rate = 0.0
        if revenue_last_month > 0:
            revenue_growth_rate = ((revenue_this_month - revenue_last_month) / revenue_last_month) * 100
        
        # Revenue by tournament
        revenue_by_tournament = []
        tournaments = self.db.query(Tournament).filter(
            Tournament.current_participants > 0
        ).order_by(desc(Tournament.entry_fee * Tournament.current_participants)).limit(10).all()
        
        for tournament in tournaments:
            revenue_by_tournament.append({
                "tournament_id": tournament.id,
                "tournament_name": tournament.name,
                "revenue": tournament.entry_fee * tournament.current_participants,
                "participants": tournament.current_participants,
                "entry_fee": tournament.entry_fee
            })
        
        return RevenueAnalyticsResponse(
            total_revenue=total_entry_fees,
            total_entry_fees=total_entry_fees,
            total_prizes_distributed=total_prizes_distributed,
            net_revenue=net_revenue,
            revenue_today=revenue_today,
            revenue_this_week=revenue_this_week,
            revenue_this_month=revenue_this_month,
            revenue_growth_rate=revenue_growth_rate,
            revenue_by_tournament=revenue_by_tournament
        )
    
    # ========================================================================
    # User Growth Analytics
    # ========================================================================
    
    def calculate_user_growth(self) -> UserGrowthMetrics:
        """
        Calculate user growth metrics.
        
        Returns:
            User growth data
        """
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=now.weekday())
        month_start = today_start.replace(day=1)
        
        # Total users
        total_users = self.db.query(User).count()
        
        # New users
        new_users_today = self.db.query(User).filter(
            User.created_at >= today_start
        ).count()
        
        new_users_this_week = self.db.query(User).filter(
            User.created_at >= week_start
        ).count()
        
        new_users_this_month = self.db.query(User).filter(
            User.created_at >= month_start
        ).count()
        
        # Growth rate (month over month)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)
        new_users_last_month = self.db.query(User).filter(
            and_(
                User.created_at >= last_month_start,
                User.created_at < month_start
            )
        ).count()
        
        growth_rate = 0.0
        if new_users_last_month > 0:
            growth_rate = ((new_users_this_month - new_users_last_month) / new_users_last_month) * 100
        
        # Active users (users who have made trades)
        active_users_today = self.db.query(func.count(func.distinct(PaperOrder.user_id))).filter(
            PaperOrder.created_at >= today_start
        ).scalar() or 0
        
        active_users_this_week = self.db.query(func.count(func.distinct(PaperOrder.user_id))).filter(
            PaperOrder.created_at >= week_start
        ).scalar() or 0
        
        active_users_this_month = self.db.query(func.count(func.distinct(PaperOrder.user_id))).filter(
            PaperOrder.created_at >= month_start
        ).scalar() or 0
        
        # Retention rate (users who signed up last month and are still active)
        users_from_last_month = self.db.query(User.id).filter(
            and_(
                User.created_at >= last_month_start,
                User.created_at < month_start
            )
        ).all()
        
        user_ids_from_last_month = [u.id for u in users_from_last_month]
        
        active_from_last_month = 0
        if user_ids_from_last_month:
            active_from_last_month = self.db.query(func.count(func.distinct(PaperOrder.user_id))).filter(
                and_(
                    PaperOrder.user_id.in_(user_ids_from_last_month),
                    PaperOrder.created_at >= month_start
                )
            ).scalar() or 0
        
        retention_rate = 0.0
        if len(user_ids_from_last_month) > 0:
            retention_rate = (active_from_last_month / len(user_ids_from_last_month)) * 100
        
        # Daily signups for the last 30 days
        daily_signups = []
        for i in range(30):
            day_start = today_start - timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            
            signups = self.db.query(User).filter(
                and_(
                    User.created_at >= day_start,
                    User.created_at < day_end
                )
            ).count()
            
            daily_signups.append({
                "date": day_start.strftime("%Y-%m-%d"),
                "signups": signups
            })
        
        daily_signups.reverse()  # Oldest to newest
        
        return UserGrowthMetrics(
            total_users=total_users,
            new_users_today=new_users_today,
            new_users_this_week=new_users_this_week,
            new_users_this_month=new_users_this_month,
            growth_rate=growth_rate,
            active_users_today=active_users_today,
            active_users_this_week=active_users_this_week,
            active_users_this_month=active_users_this_month,
            retention_rate=retention_rate,
            daily_signups=daily_signups
        )
    
    # ========================================================================
    # Tournament Performance Analytics
    # ========================================================================
    
    def calculate_tournament_performance(self) -> TournamentPerformanceMetrics:
        """
        Calculate tournament performance metrics.
        
        Returns:
            Tournament performance data
        """
        # Tournament counts
        total_tournaments = self.db.query(Tournament).count()
        active_tournaments = self.db.query(Tournament).filter(
            Tournament.status.in_([TournamentStatus.ACTIVE, TournamentStatus.REGISTRATION_OPEN])
        ).count()
        completed_tournaments = self.db.query(Tournament).filter(
            Tournament.status == TournamentStatus.COMPLETED
        ).count()
        
        # Participation metrics
        total_participants_all_time = self.db.query(TournamentParticipant).count()
        
        avg_participants_per_tournament = 0.0
        if total_tournaments > 0:
            avg_participants_per_tournament = total_participants_all_time / total_tournaments
        
        # Engagement metrics
        total_trades = self.db.query(func.sum(TournamentParticipant.total_trades)).scalar() or 0
        avg_trades_per_tournament = 0.0
        if total_tournaments > 0:
            avg_trades_per_tournament = total_trades / total_tournaments
        
        # Volume per tournament
        total_volume = 0.0
        tournaments = self.db.query(Tournament).all()
        for tournament in tournaments:
            participant_ids = [
                p.user_id for p in self.db.query(TournamentParticipant).filter(
                    TournamentParticipant.tournament_id == tournament.id
                ).all()
            ]
            if participant_ids:
                volume = self.db.query(func.sum(PaperOrder.quantity * PaperOrder.price)).filter(
                    and_(
                        PaperOrder.user_id.in_(participant_ids),
                        PaperOrder.status == OrderStatus.EXECUTED
                    )
                ).scalar() or 0.0
                total_volume += volume
        
        avg_volume_per_tournament = 0.0
        if total_tournaments > 0:
            avg_volume_per_tournament = total_volume / total_tournaments
        
        # Most popular tournaments
        most_popular_tournaments = []
        popular = self.db.query(Tournament).order_by(
            desc(Tournament.current_participants)
        ).limit(10).all()
        
        for tournament in popular:
            most_popular_tournaments.append({
                "tournament_id": tournament.id,
                "tournament_name": tournament.name,
                "participants": tournament.current_participants,
                "status": tournament.status.value,
                "prize_pool": tournament.prize_pool,
                "entry_fee": tournament.entry_fee
            })
        
        # Completion rate
        completion_rate = 0.0
        if total_tournaments > 0:
            completion_rate = (completed_tournaments / total_tournaments) * 100
        
        return TournamentPerformanceMetrics(
            total_tournaments=total_tournaments,
            active_tournaments=active_tournaments,
            completed_tournaments=completed_tournaments,
            avg_participants_per_tournament=avg_participants_per_tournament,
            total_participants_all_time=total_participants_all_time,
            avg_trades_per_tournament=avg_trades_per_tournament,
            avg_volume_per_tournament=avg_volume_per_tournament,
            most_popular_tournaments=most_popular_tournaments,
            completion_rate=completion_rate
        )
    
    # ========================================================================
    # Trading Volume Statistics
    # ========================================================================
    
    def get_trading_volume_stats(self) -> Dict[str, Any]:
        """
        Get trading volume statistics.
        
        Returns:
            Trading volume data
        """
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=now.weekday())
        month_start = today_start.replace(day=1)
        
        # Total volume
        total_volume = self.db.query(
            func.sum(PaperOrder.quantity * PaperOrder.price)
        ).filter(PaperOrder.status == OrderStatus.EXECUTED).scalar() or 0.0
        
        # Volume today
        volume_today = self.db.query(
            func.sum(PaperOrder.quantity * PaperOrder.price)
        ).filter(
            and_(
                PaperOrder.status == OrderStatus.EXECUTED,
                PaperOrder.created_at >= today_start
            )
        ).scalar() or 0.0
        
        # Volume this week
        volume_this_week = self.db.query(
            func.sum(PaperOrder.quantity * PaperOrder.price)
        ).filter(
            and_(
                PaperOrder.status == OrderStatus.EXECUTED,
                PaperOrder.created_at >= week_start
            )
        ).scalar() or 0.0
        
        # Volume this month
        volume_this_month = self.db.query(
            func.sum(PaperOrder.quantity * PaperOrder.price)
        ).filter(
            and_(
                PaperOrder.status == OrderStatus.EXECUTED,
                PaperOrder.created_at >= month_start
            )
        ).scalar() or 0.0
        
        # Average order size
        avg_order_size = self.db.query(
            func.avg(PaperOrder.quantity * PaperOrder.price)
        ).filter(PaperOrder.status == OrderStatus.EXECUTED).scalar() or 0.0
        
        # Total orders
        total_orders = self.db.query(PaperOrder).filter(
            PaperOrder.status == OrderStatus.EXECUTED
        ).count()
        
        return {
            "total_volume": total_volume,
            "volume_today": volume_today,
            "volume_this_week": volume_this_week,
            "volume_this_month": volume_this_month,
            "avg_order_size": avg_order_size,
            "total_orders": total_orders
        }
    
    # ========================================================================
    # User Engagement Metrics
    # ========================================================================
    
    def get_user_engagement_metrics(self) -> Dict[str, Any]:
        """
        Get user engagement metrics.
        
        Returns:
            User engagement data
        """
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=now.weekday())
        month_start = today_start.replace(day=1)
        
        # Total users
        total_users = self.db.query(User).count()
        
        # Users with at least one trade
        users_with_trades = self.db.query(func.count(func.distinct(PaperOrder.user_id))).scalar() or 0
        
        # Users in tournaments
        users_in_tournaments = self.db.query(func.count(func.distinct(TournamentParticipant.user_id))).scalar() or 0
        
        # Average trades per user
        avg_trades_per_user = 0.0
        if users_with_trades > 0:
            total_trades = self.db.query(PaperOrder).filter(
                PaperOrder.status == OrderStatus.EXECUTED
            ).count()
            avg_trades_per_user = total_trades / users_with_trades
        
        # Average tournaments per user
        avg_tournaments_per_user = 0.0
        if users_in_tournaments > 0:
            total_participations = self.db.query(TournamentParticipant).count()
            avg_tournaments_per_user = total_participations / users_in_tournaments
        
        # Daily active users (last 30 days)
        daily_active_users = []
        for i in range(30):
            day_start = today_start - timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            
            active_users = self.db.query(func.count(func.distinct(PaperOrder.user_id))).filter(
                and_(
                    PaperOrder.created_at >= day_start,
                    PaperOrder.created_at < day_end
                )
            ).scalar() or 0
            
            daily_active_users.append({
                "date": day_start.strftime("%Y-%m-%d"),
                "active_users": active_users
            })
        
        daily_active_users.reverse()  # Oldest to newest
        
        return {
            "total_users": total_users,
            "users_with_trades": users_with_trades,
            "users_in_tournaments": users_in_tournaments,
            "engagement_rate": (users_with_trades / total_users * 100) if total_users > 0 else 0,
            "tournament_participation_rate": (users_in_tournaments / total_users * 100) if total_users > 0 else 0,
            "avg_trades_per_user": avg_trades_per_user,
            "avg_tournaments_per_user": avg_tournaments_per_user,
            "daily_active_users": daily_active_users
        }

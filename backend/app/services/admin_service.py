"""
Admin service for administrative operations and management.
"""

from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from app.models.user import User
from app.models.tournament import Tournament, TournamentStatus
from app.models.tournament_participant import TournamentParticipant
from app.models.tournament_ranking import TournamentRanking
from app.models.paper_order import PaperOrder, OrderStatus
from app.models.admin_action import AdminAction
from app.models.notification import Notification, NotificationType
from app.schemas.admin import (
    DashboardOverviewResponse,
    RecentActivityItem,
    TournamentAnalyticsResponse,
    ParticipantDetail,
    UserAnalyticsResponse,
    UserTournamentHistory
)
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class AdminService:
    """Service for admin operations and management."""
    
    def __init__(self, db: Session):
        """
        Initialize admin service.
        
        Args:
            db: Database session
        """
        self.db = db
    
    # ========================================================================
    # Dashboard Methods
    # ========================================================================
    
    def get_dashboard_overview(self) -> DashboardOverviewResponse:
        """
        Get comprehensive dashboard overview.
        
        Returns:
            Dashboard overview with key metrics
        """
        # User metrics
        total_users = self.db.query(User).count()
        active_users = self.db.query(User).filter(User.is_active == True).count()
        
        # Tournament metrics
        total_tournaments = self.db.query(Tournament).count()
        active_tournaments = self.db.query(Tournament).filter(
            Tournament.status.in_([TournamentStatus.REGISTRATION_OPEN, TournamentStatus.ACTIVE])
        ).count()
        completed_tournaments = self.db.query(Tournament).filter(
            Tournament.status == TournamentStatus.COMPLETED
        ).count()
        
        # Participant metrics
        total_participants = self.db.query(TournamentParticipant).count()
        
        # Order metrics
        total_orders = self.db.query(PaperOrder).count()
        executed_orders = self.db.query(PaperOrder).filter(
            PaperOrder.status == OrderStatus.EXECUTED
        ).count()
        
        # Revenue metrics
        total_revenue = self.db.query(func.sum(Tournament.entry_fee * Tournament.current_participants)).scalar() or 0.0
        
        # Platform balance (sum of all user wallets)
        from app.models.wallet import Wallet
        platform_balance = self.db.query(func.sum(Wallet.balance)).scalar() or 0.0
        
        return DashboardOverviewResponse(
            total_users=total_users,
            active_users=active_users,
            total_tournaments=total_tournaments,
            active_tournaments=active_tournaments,
            completed_tournaments=completed_tournaments,
            total_participants=total_participants,
            total_orders=total_orders,
            executed_orders=executed_orders,
            total_revenue=total_revenue,
            platform_balance=platform_balance
        )
    
    def get_recent_activity(self, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """
        Get recent platform activity.
        
        Args:
            limit: Maximum number of activities
            offset: Offset for pagination
            
        Returns:
            Recent activity items
        """
        activities = []
        
        # Get recent admin actions
        admin_actions = self.db.query(AdminAction).order_by(
            desc(AdminAction.created_at)
        ).limit(limit).offset(offset).all()
        
        for action in admin_actions:
            admin_user = self.db.query(User).filter(User.id == action.admin_user_id).first()
            activities.append(RecentActivityItem(
                id=action.id,
                type=action.action_type,
                description=action.description,
                user_id=action.admin_user_id,
                username=admin_user.username if admin_user else "Unknown",
                timestamp=action.created_at,
                metadata=action.action_metadata
            ))
        
        total_count = self.db.query(AdminAction).count()
        
        return {
            "activities": activities,
            "total_count": total_count,
            "page": offset // limit + 1 if limit > 0 else 1,
            "page_size": limit
        }
    
    def get_top_performers(self, metric: str = "pnl", limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get top performing users.
        
        Args:
            metric: Metric to rank by (pnl, win_rate, roi, trades)
            limit: Number of top performers
            
        Returns:
            List of top performers
        """
        # Aggregate participant stats by user
        if metric == "pnl":
            order_by = desc(func.sum(TournamentParticipant.total_pnl))
            metric_name = "Total P&L"
        elif metric == "win_rate":
            order_by = desc(func.avg(TournamentParticipant.win_rate))
            metric_name = "Win Rate"
        elif metric == "roi":
            order_by = desc(func.avg(TournamentParticipant.roi))
            metric_name = "ROI"
        else:  # trades
            order_by = desc(func.sum(TournamentParticipant.total_trades))
            metric_name = "Total Trades"
        
        results = self.db.query(
            TournamentParticipant.user_id,
            func.sum(TournamentParticipant.total_pnl).label('total_pnl'),
            func.avg(TournamentParticipant.win_rate).label('avg_win_rate'),
            func.avg(TournamentParticipant.roi).label('avg_roi'),
            func.sum(TournamentParticipant.total_trades).label('total_trades'),
            func.count(TournamentParticipant.id).label('tournaments_joined')
        ).group_by(TournamentParticipant.user_id).order_by(order_by).limit(limit).all()
        
        performers = []
        for result in results:
            user = self.db.query(User).filter(User.id == result.user_id).first()
            if user:
                if metric == "pnl":
                    metric_value = float(result.total_pnl or 0)
                elif metric == "win_rate":
                    metric_value = float(result.avg_win_rate or 0)
                elif metric == "roi":
                    metric_value = float(result.avg_roi or 0)
                else:
                    metric_value = float(result.total_trades or 0)
                
                performers.append({
                    "user_id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "metric_value": metric_value,
                    "metric_name": metric_name,
                    "tournaments_joined": result.tournaments_joined,
                    "total_trades": result.total_trades or 0
                })
        
        return performers
    
    # ========================================================================
    # Tournament Management Methods
    # ========================================================================
    
    def get_tournament_analytics(self, tournament_id: int) -> Optional[TournamentAnalyticsResponse]:
        """
        Get detailed tournament analytics.
        
        Args:
            tournament_id: Tournament ID
            
        Returns:
            Tournament analytics or None
        """
        tournament = self.db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if not tournament:
            return None
        
        # Participation metrics
        participants = self.db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == tournament_id
        ).all()
        
        total_participants = len(participants)
        active_participants = sum(1 for p in participants if p.total_trades > 0)
        
        # Trading metrics
        total_trades = sum(p.total_trades for p in participants)
        avg_trades_per_participant = total_trades / total_participants if total_participants > 0 else 0
        
        # Get total volume from orders
        total_volume = self.db.query(func.sum(PaperOrder.quantity * PaperOrder.price)).filter(
            PaperOrder.user_id.in_([p.user_id for p in participants]),
            PaperOrder.status == OrderStatus.EXECUTED
        ).scalar() or 0.0
        
        avg_trade_size = total_volume / total_trades if total_trades > 0 else 0
        
        # Performance metrics
        total_pnl = sum(p.total_pnl for p in participants)
        avg_pnl = total_pnl / total_participants if total_participants > 0 else 0
        top_pnl = max((p.total_pnl for p in participants), default=0)
        worst_pnl = min((p.total_pnl for p in participants), default=0)
        
        # Distribution
        profitable_participants = sum(1 for p in participants if p.total_pnl > 0)
        losing_participants = sum(1 for p in participants if p.total_pnl < 0)
        break_even_participants = sum(1 for p in participants if p.total_pnl == 0)
        
        # Time metrics
        now = datetime.now(tournament.start_date.tzinfo)
        days_remaining = None
        if tournament.status == TournamentStatus.ACTIVE:
            days_remaining = (tournament.end_date - now).days
        
        return TournamentAnalyticsResponse(
            tournament_id=tournament.id,
            tournament_name=tournament.name,
            status=tournament.status,
            total_participants=total_participants,
            active_participants=active_participants,
            avg_trades_per_participant=avg_trades_per_participant,
            total_trades=total_trades,
            total_volume=total_volume,
            avg_trade_size=avg_trade_size,
            total_pnl=total_pnl,
            avg_pnl=avg_pnl,
            top_pnl=top_pnl,
            worst_pnl=worst_pnl,
            profitable_participants=profitable_participants,
            losing_participants=losing_participants,
            break_even_participants=break_even_participants,
            start_date=tournament.start_date,
            end_date=tournament.end_date,
            days_remaining=days_remaining
        )
    
    def get_tournament_participants(
        self, 
        tournament_id: int, 
        limit: int = 100, 
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Get all participants in a tournament.
        
        Args:
            tournament_id: Tournament ID
            limit: Maximum number of participants
            offset: Offset for pagination
            
        Returns:
            Participants list with details
        """
        participants = self.db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == tournament_id
        ).order_by(desc(TournamentParticipant.total_pnl)).limit(limit).offset(offset).all()
        
        participant_details = []
        for participant in participants:
            user = self.db.query(User).filter(User.id == participant.user_id).first()
            ranking = self.db.query(TournamentRanking).filter(
                TournamentRanking.tournament_id == tournament_id,
                TournamentRanking.user_id == participant.user_id
            ).first()
            
            if user:
                participant_details.append(ParticipantDetail(
                    id=participant.id,
                    user_id=user.id,
                    username=user.username,
                    email=user.email,
                    starting_balance=participant.starting_balance,
                    current_balance=participant.current_balance,
                    total_pnl=participant.total_pnl,
                    roi=participant.roi,
                    total_trades=participant.total_trades,
                    winning_trades=participant.winning_trades,
                    losing_trades=participant.losing_trades,
                    win_rate=participant.win_rate,
                    rank=ranking.rank if ranking else None,
                    joined_at=participant.joined_at,
                    last_trade_at=participant.last_trade_at
                ))
        
        total_count = self.db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == tournament_id
        ).count()
        
        return {
            "tournament_id": tournament_id,
            "participants": participant_details,
            "total_count": total_count,
            "page": offset // limit + 1 if limit > 0 else 1,
            "page_size": limit
        }
    
    def remove_participant_from_tournament(
        self, 
        tournament_id: int, 
        user_id: int,
        admin_user_id: int,
        reason: Optional[str] = None
    ) -> bool:
        """
        Remove a participant from a tournament.
        
        Args:
            tournament_id: Tournament ID
            user_id: User ID to remove
            admin_user_id: Admin performing the action
            reason: Optional reason for removal
            
        Returns:
            True if removed, False otherwise
        """
        participant = self.db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == tournament_id,
            TournamentParticipant.user_id == user_id
        ).first()
        
        if not participant:
            return False
        
        tournament = self.db.query(Tournament).filter(Tournament.id == tournament_id).first()
        user = self.db.query(User).filter(User.id == user_id).first()
        
        # Delete participant
        self.db.delete(participant)
        
        # Update tournament participant count
        if tournament:
            tournament.current_participants = max(0, tournament.current_participants - 1)
        
        # Delete ranking
        ranking = self.db.query(TournamentRanking).filter(
            TournamentRanking.tournament_id == tournament_id,
            TournamentRanking.user_id == user_id
        ).first()
        if ranking:
            self.db.delete(ranking)
        
        # Log admin action
        self.log_admin_action(
            admin_user_id=admin_user_id,
            action_type="REMOVE_PARTICIPANT",
            target_type="TOURNAMENT_PARTICIPANT",
            target_id=participant.id,
            description=f"Removed user {user.username if user else user_id} from tournament {tournament.name if tournament else tournament_id}",
            action_metadata={"reason": reason, "tournament_id": tournament_id, "user_id": user_id}
        )
        
        # Send notification to user
        if user:
            self.create_notification(
                user_id=user_id,
                title="Removed from Tournament",
                message=f"You have been removed from tournament '{tournament.name if tournament else 'Unknown'}'. {reason or ''}",
                type=NotificationType.WARNING
            )
        
        self.db.commit()
        logger.info(f"Removed participant {user_id} from tournament {tournament_id}")
        return True
    
    def add_participant_to_tournament(
        self,
        tournament_id: int,
        user_id: int,
        admin_user_id: int,
        starting_balance: Optional[float] = None
    ) -> Optional[TournamentParticipant]:
        """
        Manually add a participant to a tournament.
        
        Args:
            tournament_id: Tournament ID
            user_id: User ID to add
            admin_user_id: Admin performing the action
            starting_balance: Optional custom starting balance
            
        Returns:
            TournamentParticipant or None
        """
        tournament = self.db.query(Tournament).filter(Tournament.id == tournament_id).first()
        user = self.db.query(User).filter(User.id == user_id).first()
        
        if not tournament or not user:
            return None
        
        # Check if already participating
        existing = self.db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == tournament_id,
            TournamentParticipant.user_id == user_id
        ).first()
        
        if existing:
            return None
        
        # Use custom starting balance or tournament default
        balance = starting_balance or tournament.starting_balance
        
        # Create participant
        participant = TournamentParticipant(
            tournament_id=tournament_id,
            user_id=user_id,
            entry_fee_paid=True,
            starting_balance=balance,
            current_balance=balance
        )
        self.db.add(participant)
        
        # Update tournament count
        tournament.current_participants += 1
        
        # Create ranking
        ranking = TournamentRanking(
            tournament_id=tournament_id,
            user_id=user_id,
            rank=tournament.current_participants,
            current_balance=balance
        )
        self.db.add(ranking)
        
        # Log admin action
        self.log_admin_action(
            admin_user_id=admin_user_id,
            action_type="ADD_PARTICIPANT",
            target_type="TOURNAMENT_PARTICIPANT",
            target_id=None,
            description=f"Manually added user {user.username} to tournament {tournament.name}",
            action_metadata={"tournament_id": tournament_id, "user_id": user_id, "starting_balance": balance}
        )
        
        # Send notification
        self.create_notification(
            user_id=user_id,
            title="Added to Tournament",
            message=f"You have been added to tournament '{tournament.name}' by an admin.",
            type=NotificationType.SUCCESS
        )
        
        self.db.commit()
        self.db.refresh(participant)
        
        logger.info(f"Manually added participant {user_id} to tournament {tournament_id}")
        return participant
    
    # ========================================================================
    # User Management Methods
    # ========================================================================
    
    def get_user_analytics(self, user_id: int) -> Optional[UserAnalyticsResponse]:
        """
        Get detailed user analytics.
        
        Args:
            user_id: User ID
            
        Returns:
            User analytics or None
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        # Tournament stats
        participants = self.db.query(TournamentParticipant).filter(
            TournamentParticipant.user_id == user_id
        ).all()
        
        tournaments_joined = len(participants)
        tournaments_completed = sum(
            1 for p in participants 
            if self.db.query(Tournament).filter(
                Tournament.id == p.tournament_id,
                Tournament.status == TournamentStatus.COMPLETED
            ).first()
        )
        active_tournaments = sum(
            1 for p in participants 
            if self.db.query(Tournament).filter(
                Tournament.id == p.tournament_id,
                Tournament.status.in_([TournamentStatus.ACTIVE, TournamentStatus.REGISTRATION_OPEN])
            ).first()
        )
        
        # Trading stats
        total_trades = sum(p.total_trades for p in participants)
        total_pnl = sum(p.total_pnl for p in participants)
        avg_pnl_per_trade = total_pnl / total_trades if total_trades > 0 else 0
        
        winning_trades = sum(p.winning_trades for p in participants)
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
        
        # Volume
        orders = self.db.query(PaperOrder).filter(
            PaperOrder.user_id == user_id,
            PaperOrder.status == OrderStatus.EXECUTED
        ).all()
        total_volume = sum(order.quantity * order.price for order in orders)
        
        # Financial stats
        from app.models.wallet import Wallet
        wallet = self.db.query(Wallet).filter(Wallet.user_id == user_id).first()
        current_balance = wallet.balance if wallet else 0
        
        # Rankings
        rankings = self.db.query(TournamentRanking).filter(
            TournamentRanking.user_id == user_id
        ).all()
        best_rank = min((r.rank for r in rankings), default=None)
        avg_rank = sum(r.rank for r in rankings) / len(rankings) if rankings else None
        
        return UserAnalyticsResponse(
            user_id=user.id,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
            is_admin=user.is_admin,
            created_at=user.created_at,
            tournaments_joined=tournaments_joined,
            tournaments_completed=tournaments_completed,
            active_tournaments=active_tournaments,
            total_trades=total_trades,
            total_volume=total_volume,
            total_pnl=total_pnl,
            avg_pnl_per_trade=avg_pnl_per_trade,
            win_rate=win_rate,
            current_balance=current_balance,
            total_winnings=0.0,  # TODO: Calculate from prize distributions
            total_entry_fees_paid=sum(
                self.db.query(Tournament.entry_fee).filter(Tournament.id == p.tournament_id).scalar() or 0
                for p in participants
            ),
            best_rank=best_rank,
            avg_rank=avg_rank
        )
    
    def get_user_tournament_history(self, user_id: int) -> List[UserTournamentHistory]:
        """
        Get user's tournament history.
        
        Args:
            user_id: User ID
            
        Returns:
            List of tournament history
        """
        participants = self.db.query(TournamentParticipant).filter(
            TournamentParticipant.user_id == user_id
        ).all()
        
        history = []
        for participant in participants:
            tournament = self.db.query(Tournament).filter(
                Tournament.id == participant.tournament_id
            ).first()
            ranking = self.db.query(TournamentRanking).filter(
                TournamentRanking.tournament_id == participant.tournament_id,
                TournamentRanking.user_id == user_id
            ).first()
            
            if tournament:
                history.append(UserTournamentHistory(
                    tournament_id=tournament.id,
                    tournament_name=tournament.name,
                    status=tournament.status,
                    rank=ranking.rank if ranking else None,
                    total_pnl=participant.total_pnl,
                    roi=participant.roi,
                    total_trades=participant.total_trades,
                    joined_at=participant.joined_at
                ))
        
        return history
    
    # ========================================================================
    # Utility Methods
    # ========================================================================
    
    def log_admin_action(
        self,
        admin_user_id: int,
        action_type: str,
        target_type: str,
        description: str,
        target_id: Optional[int] = None,
        action_metadata: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AdminAction:
        """
        Log an admin action for audit trail.
        
        Args:
            admin_user_id: Admin user ID
            action_type: Type of action
            target_type: Type of target entity
            description: Human-readable description
            target_id: Optional target entity ID
            action_metadata: Optional additional data
            ip_address: Optional IP address
            user_agent: Optional user agent
            
        Returns:
            Created AdminAction
        """
        action = AdminAction(
            admin_user_id=admin_user_id,
            action_type=action_type,
            target_type=target_type,
            target_id=target_id,
            description=description,
            action_metadata=action_metadata,
            ip_address=ip_address,
            user_agent=user_agent
        )
        self.db.add(action)
        self.db.commit()
        self.db.refresh(action)
        
        logger.info(f"Admin action logged: {action_type} by user {admin_user_id}")
        return action
    
    def create_notification(
        self,
        user_id: int,
        title: str,
        message: str,
        type: NotificationType = NotificationType.INFO,
        action_url: Optional[str] = None
    ) -> Notification:
        """
        Create a notification for a user.
        
        Args:
            user_id: User ID
            title: Notification title
            message: Notification message
            type: Notification type
            action_url: Optional action URL
            
        Returns:
            Created Notification
        """
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            action_url=action_url
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        
        logger.info(f"Notification created for user {user_id}: {title}")
        return notification
    
    def send_bulk_notification(
        self,
        user_ids: List[int],
        title: str,
        message: str,
        type: NotificationType = NotificationType.INFO,
        action_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send notification to multiple users.
        
        Args:
            user_ids: List of user IDs
            title: Notification title
            message: Notification message
            type: Notification type
            action_url: Optional action URL
            
        Returns:
            Result with success count and failed user IDs
        """
        notifications_sent = 0
        failed_user_ids = []
        
        for user_id in user_ids:
            try:
                self.create_notification(user_id, title, message, type, action_url)
                notifications_sent += 1
            except Exception as e:
                logger.error(f"Failed to send notification to user {user_id}: {e}")
                failed_user_ids.append(user_id)
        
        return {
            "success": True,
            "notifications_sent": notifications_sent,
            "failed_user_ids": failed_user_ids,
            "message": f"Sent {notifications_sent} notifications, {len(failed_user_ids)} failed"
        }

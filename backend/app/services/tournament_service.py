"""
Tournament service for managing trading competitions.
"""

from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime

from app.models.tournament import Tournament, TournamentStatus, TournamentType
from app.models.tournament_participant import TournamentParticipant
from app.models.tournament_ranking import TournamentRanking
from app.models.user import User
from app.schemas.tournament import TournamentCreate, TournamentUpdate
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class TournamentService:
    """Service for tournament management and leaderboard."""
    
    def __init__(self, db: Session):
        """
        Initialize tournament service.
        
        Args:
            db: Database session
        """
        self.db = db
    
    def create_tournament(self, tournament_data: TournamentCreate, created_by: int) -> Tournament:
        """
        Create a new tournament.
        
        Args:
            tournament_data: Tournament creation data
            created_by: Admin user ID
            
        Returns:
            Created Tournament instance
        """
        tournament = Tournament(
            name=tournament_data.name,
            description=tournament_data.description,
            tournament_type=tournament_data.tournament_type,
            team_size=tournament_data.team_size,
            entry_fee=tournament_data.entry_fee,
            prize_pool=tournament_data.prize_pool,
            starting_balance=tournament_data.starting_balance,
            max_participants=tournament_data.max_participants,
            start_date=tournament_data.start_date,
            end_date=tournament_data.end_date,
            registration_deadline=tournament_data.registration_deadline,
            rules=tournament_data.rules,
            status=TournamentStatus.REGISTRATION_OPEN,
            created_by=created_by
        )
        
        self.db.add(tournament)
        self.db.commit()
        self.db.refresh(tournament)
        
        logger.info(f"Tournament created: {tournament.name} (ID: {tournament.id})")
        return tournament
    
    def update_tournament(self, tournament_id: int, update_data: TournamentUpdate) -> Optional[Tournament]:
        """
        Update tournament details.
        
        Args:
            tournament_id: Tournament ID
            update_data: Update data
            
        Returns:
            Updated Tournament or None
        """
        tournament = self.db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if not tournament:
            return None
        
        # Update fields
        for field, value in update_data.dict(exclude_unset=True).items():
            setattr(tournament, field, value)
        
        self.db.commit()
        self.db.refresh(tournament)
        
        logger.info(f"Tournament updated: {tournament_id}")
        return tournament
    
    def join_tournament(self, tournament_id: int, user_id: int) -> TournamentParticipant:
        """
        Register user for a SOLO tournament.
        
        Args:
            tournament_id: Tournament ID
            user_id: User ID
            
        Returns:
            TournamentParticipant instance
            
        Raises:
            ValueError: If registration fails
        """
        tournament = self.db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if not tournament:
            raise ValueError("Tournament not found")
        
        # Check if it's a solo tournament
        if tournament.tournament_type == TournamentType.TEAM:
            raise ValueError("This is a team tournament. Create or join a team to participate")
        
        if not tournament.is_registration_open:
            raise ValueError("Registration is closed for this tournament")
        
        # Check if already registered
        existing = self.db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == tournament_id,
            TournamentParticipant.user_id == user_id
        ).first()
        
        if existing:
            raise ValueError("Already registered for this tournament")
        
        # Create participant
        participant = TournamentParticipant(
            tournament_id=tournament_id,
            user_id=user_id,
            entry_fee_paid=True,  # In production, integrate payment gateway
            starting_balance=tournament.starting_balance,
            initial_balance=tournament.starting_balance,  # Set initial_balance for API compatibility
            current_balance=tournament.starting_balance,
            total_pnl=0.0,
            pnl=0.0,  # Set pnl for API compatibility
            rank=None,
            is_active=True
        )
        
        self.db.add(participant)
        
        # Update tournament participant count
        tournament.current_participants += 1
        
        # Create initial ranking entry
        ranking = TournamentRanking(
            tournament_id=tournament_id,
            user_id=user_id,
            rank=tournament.current_participants,
            current_balance=tournament.starting_balance
        )
        self.db.add(ranking)
        
        self.db.commit()
        self.db.refresh(participant)
        
        logger.info(f"User {user_id} joined tournament {tournament_id}")
        return participant
    
    def update_participant_stats(self, tournament_id: int, user_id: int, trade_pnl: float):
        """
        Update participant statistics after a trade.
        
        Args:
            tournament_id: Tournament ID
            user_id: User ID
            trade_pnl: Profit/loss from the trade
        """
        participant = self.db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == tournament_id,
            TournamentParticipant.user_id == user_id
        ).first()
        
        if participant:
            participant.update_stats(trade_pnl)
            self.db.commit()
            
            # Update rankings
            self.update_rankings(tournament_id)
            
            logger.info(f"Updated stats for user {user_id} in tournament {tournament_id}")
    
    def update_rankings(self, tournament_id: int):
        """
        Update tournament rankings based on current P&L.
        
        Args:
            tournament_id: Tournament ID
        """
        # Get all participants sorted by P&L
        participants = self.db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == tournament_id
        ).order_by(desc(TournamentParticipant.total_pnl)).all()
        
        # Update rankings
        for rank, participant in enumerate(participants, start=1):
            ranking = self.db.query(TournamentRanking).filter(
                TournamentRanking.tournament_id == tournament_id,
                TournamentRanking.user_id == participant.user_id
            ).first()
            
            if ranking:
                ranking.rank = rank
                ranking.total_pnl = participant.total_pnl
                ranking.roi = participant.roi
                ranking.total_trades = participant.total_trades
                ranking.win_rate = participant.win_rate
                ranking.current_balance = participant.current_balance
        
        self.db.commit()
        logger.info(f"Updated rankings for tournament {tournament_id}")
    
    def get_leaderboard(self, tournament_id: int, limit: int = 100) -> List[TournamentRanking]:
        """
        Get tournament leaderboard.
        
        Args:
            tournament_id: Tournament ID
            limit: Maximum number of entries
            
        Returns:
            List of TournamentRanking instances
        """
        rankings = self.db.query(TournamentRanking).filter(
            TournamentRanking.tournament_id == tournament_id
        ).order_by(TournamentRanking.rank).limit(limit).all()
        
        return rankings
    
    def get_user_rank(self, tournament_id: int, user_id: int) -> Optional[TournamentRanking]:
        """
        Get user's rank in a tournament.
        
        Args:
            tournament_id: Tournament ID
            user_id: User ID
            
        Returns:
            TournamentRanking or None
        """
        return self.db.query(TournamentRanking).filter(
            TournamentRanking.tournament_id == tournament_id,
            TournamentRanking.user_id == user_id
        ).first()
    
    def get_active_tournaments(self) -> List[Tournament]:
        """
        Get all active tournaments.
        
        Returns:
            List of active Tournament instances
        """
        return self.db.query(Tournament).filter(
            Tournament.status.in_([TournamentStatus.REGISTRATION_OPEN, TournamentStatus.ACTIVE])
        ).all()
    
    def get_tournament_by_id(self, tournament_id: int) -> Optional[Tournament]:
        """
        Get tournament by ID.
        
        Args:
            tournament_id: Tournament ID
            
        Returns:
            Tournament or None
        """
        return self.db.query(Tournament).filter(Tournament.id == tournament_id).first()
    
    def get_user_tournaments(self, user_id: int) -> List[Tournament]:
        """
        Get tournaments user is participating in.
        
        Args:
            user_id: User ID
            
        Returns:
            List of Tournament instances
        """
        participant_tournaments = self.db.query(TournamentParticipant).filter(
            TournamentParticipant.user_id == user_id
        ).all()
        
        tournament_ids = [p.tournament_id for p in participant_tournaments]
        
        return self.db.query(Tournament).filter(
            Tournament.id.in_(tournament_ids)
        ).all()
    
    def start_tournament(self, tournament_id: int) -> bool:
        """
        Start a tournament (change status to ACTIVE).
        
        Args:
            tournament_id: Tournament ID
            
        Returns:
            True if started, False otherwise
        """
        tournament = self.get_tournament_by_id(tournament_id)
        if not tournament:
            return False
        
        tournament.status = TournamentStatus.ACTIVE
        self.db.commit()
        
        logger.info(f"Tournament started: {tournament_id}")
        return True
    
    def end_tournament(self, tournament_id: int) -> bool:
        """
        End a tournament (change status to COMPLETED).
        
        Args:
            tournament_id: Tournament ID
            
        Returns:
            True if ended, False otherwise
        """
        tournament = self.get_tournament_by_id(tournament_id)
        if not tournament:
            return False
        
        tournament.status = TournamentStatus.COMPLETED
        
        # Final ranking update
        self.update_rankings(tournament_id)
        
        self.db.commit()
        
        logger.info(f"Tournament ended: {tournament_id}")
        return True

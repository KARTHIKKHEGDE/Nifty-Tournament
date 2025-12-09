import React from 'react';
import { Tournament, TournamentType } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Trophy, Users, Calendar, DollarSign, Clock, UserPlus } from 'lucide-react';
import Button from '../common/Button';

interface TournamentCardProps {
    tournament: Tournament;
    onJoin: (tournamentId: number) => void;
    onViewDetails: (tournament: Tournament) => void;
    isJoined?: boolean;
    isLoading?: boolean;
}

export default function TournamentCard({
    tournament,
    onJoin,
    onViewDetails,
    isJoined = false,
    isLoading = false,
}: TournamentCardProps) {
    // Calculate actual status based on current time
    const getActualStatus = () => {
        const now = new Date();
        const startDate = new Date(tournament.start_date);
        const endDate = new Date(tournament.end_date);
        const registrationDeadline = new Date(tournament.registration_deadline);

        // If tournament has ended
        if (now >= endDate) {
            return 'COMPLETED';
        }
        // If tournament is currently running
        if (now >= startDate && now < endDate) {
            return 'ACTIVE';
        }
        // If registration is still open
        if (now < registrationDeadline) {
            return 'REGISTRATION_OPEN';
        }
        // Otherwise upcoming
        return 'UPCOMING';
    };

    const actualStatus = getActualStatus();

    const getStatusColor = () => {
        switch (actualStatus) {
            case 'ACTIVE':
                return 'bg-green-500';
            case 'REGISTRATION_OPEN':
                return 'bg-blue-500';
            case 'UPCOMING':
                return 'bg-blue-500';
            case 'COMPLETED':
                return 'bg-gray-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusText = () => {
        switch (actualStatus) {
            case 'ACTIVE':
                return 'Live Now';
            case 'REGISTRATION_OPEN':
                return 'Registration Open';
            case 'UPCOMING':
                return 'Upcoming';
            case 'COMPLETED':
                return 'Completed';
            default:
                return actualStatus;
        }
    };

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 transition-all duration-200 hover-lift">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

                <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                        <Trophy className="w-10 h-10 text-yellow-400" />
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor()}`}>
                            {getStatusText()}
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{tournament.name}</h3>
                    <p className="text-blue-100 text-sm line-clamp-2">{tournament.description}</p>
                    
                    {/* Tournament Type Badge */}
                    <div className="mt-3 flex items-center gap-2">
                        {tournament.tournament_type === TournamentType.TEAM ? (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300">
                                <UserPlus className="w-3.5 h-3.5" />
                                Team Tournament ({tournament.team_size} players)
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs font-semibold text-blue-300">
                                <Users className="w-3.5 h-3.5" />
                                Solo Tournament
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
                {/* Prize Pool */}
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <DollarSign className="w-8 h-8 text-yellow-500" />
                        <div>
                            <p className="text-sm text-gray-400">Prize Pool</p>
                            <p className="text-2xl font-bold text-yellow-500">
                                {formatCurrency(tournament.prize_pool)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <div>
                            <p className="text-xs text-gray-400">Start Time</p>
                            <p className="text-sm text-white font-medium">
                                {formatDateTime(tournament.start_date)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-500" />
                        <div>
                            <p className="text-xs text-gray-400">End Time</p>
                            <p className="text-sm text-white font-medium">
                                {formatDateTime(tournament.end_date)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Entry Fee & Participants */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <div>
                        <p className="text-xs text-gray-400">Entry Fee</p>
                        <p className="text-lg font-bold text-white">
                            {tournament.entry_fee > 0 ? formatCurrency(tournament.entry_fee) : 'Free'}
                        </p>
                    </div>
                    {tournament.max_participants && (
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-400">
                                Max {tournament.max_participants} players
                            </span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    {isJoined ? (
                        <Button
                            onClick={() => onViewDetails(tournament)}
                            variant="primary"
                            className="flex-1"
                        >
                            {tournament.tournament_type === TournamentType.TEAM ? 'View Teams' : 'View Leaderboard'}
                        </Button>
                    ) : actualStatus === 'REGISTRATION_OPEN' || actualStatus === 'UPCOMING' ? (
                        <>
                            <Button
                                onClick={() => {
                                    if (tournament.tournament_type === TournamentType.TEAM) {
                                        onViewDetails(tournament);
                                    } else {
                                        onJoin(tournament.id);
                                    }
                                }}
                                variant="success"
                                className="flex-1"
                                isLoading={isLoading}
                                disabled={actualStatus === 'UPCOMING'}
                            >
                                {actualStatus === 'UPCOMING' ? 'Registration Closed' : 
                                 tournament.tournament_type === TournamentType.TEAM ? 'View Teams' : 'Join Tournament'}
                            </Button>
                            <Button
                                onClick={() => onViewDetails(tournament)}
                                variant="secondary"
                            >
                                Details
                            </Button>
                        </>
                    ) : actualStatus === 'ACTIVE' ? (
                        <Button
                            onClick={() => onViewDetails(tournament)}
                            variant="primary"
                            className="flex-1"
                        >
                            View Leaderboard
                        </Button>
                    ) : (
                        <Button
                            onClick={() => onViewDetails(tournament)}
                            variant="secondary"
                            className="flex-1"
                        >
                            View Results
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

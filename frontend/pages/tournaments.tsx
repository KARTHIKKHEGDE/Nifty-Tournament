import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import TournamentCard from '../components/tournaments/TournamentCard';
import Leaderboard from '../components/tournaments/Leaderboard';
import TeamList from '../components/tournaments/TeamList';
import CreateTeamModal from '../components/tournaments/CreateTeamModal';
import Loader from '../components/common/Loader';
import { Tournament, TournamentRanking, TournamentStatus, TournamentType } from '../types';
import tournamentService from '../services/tournamentService';
import { useUserStore } from '../stores/userStore';
import { X } from 'lucide-react';

export default function TournamentsPage() {
    const { user } = useUserStore();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
    const [leaderboard, setLeaderboard] = useState<TournamentRanking[]>([]);
    const [joinedTournaments, setJoinedTournaments] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showTeams, setShowTeams] = useState(false);
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        loadTournaments();
    }, [filterStatus]);

    const loadTournaments = async () => {
        setIsLoading(true);
        try {
            // Convert frontend filter to backend format
            let statusParam: string | undefined = undefined;
            if (filterStatus !== 'all') {
                statusParam = filterStatus.toUpperCase();
            }
            const data = await tournamentService.getTournaments(statusParam);
            setTournaments(data);
        } catch (error) {
            console.error('Failed to load tournaments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinTournament = async (tournamentId: number) => {
        setIsJoining(true);
        try {
            await tournamentService.joinTournament(tournamentId);
            setJoinedTournaments((prev) => new Set(prev).add(tournamentId));
            alert('Successfully joined tournament!');
            // Reload tournaments to update participant count
            loadTournaments();
        } catch (error: any) {
            alert(error.message || 'Failed to join tournament');
        } finally {
            setIsJoining(false);
        }
    };

    const handleViewDetails = async (tournament: Tournament) => {
        setSelectedTournament(tournament);
        
        if (tournament.tournament_type === TournamentType.TEAM) {
            setShowTeams(true);
        } else {
            setShowLeaderboard(true);
            try {
                const data = await tournamentService.getLeaderboard(tournament.id);
                setLeaderboard(data);
            } catch (error) {
                console.error('Failed to load leaderboard:', error);
                setLeaderboard([]);
            }
        }
    };

    const handleCreateTeam = () => {
        setShowCreateTeam(true);
    };

    const handleTeamCreated = () => {
        setShowCreateTeam(false);
        // Reload teams if needed
    };

    return (
        <DashboardLayout title="Tournaments" showWatchlist={true}>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Tournaments</h1>
                    <p className="text-gray-400">
                        Compete with traders and win real money prizes! 🏆
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg w-fit">
                    {['all', 'active', 'upcoming', 'completed'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${filterStatus === status
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Tournaments Grid */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader text="Loading tournaments..." />
                    </div>
                ) : tournaments.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400">No tournaments found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tournaments.map((tournament) => (
                            <TournamentCard
                                key={tournament.id}
                                tournament={tournament}
                                onJoin={handleJoinTournament}
                                onViewDetails={handleViewDetails}
                                isJoined={joinedTournaments.has(tournament.id)}
                                isLoading={isJoining}
                            />
                        ))}
                    </div>
                )}

                {/* How It Works */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">How Tournaments Work</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-3">
                                <span className="text-2xl font-bold text-white">1</span>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Join Tournament</h3>
                            <p className="text-sm text-gray-400">
                                Browse active and upcoming tournaments. Pay entry fee (if required) and join.
                            </p>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-3">
                                <span className="text-2xl font-bold text-white">2</span>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Trade & Compete</h3>
                            <p className="text-sm text-gray-400">
                                Trade with virtual money during the tournament period. Your P&L is tracked.
                            </p>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-3">
                                <span className="text-2xl font-bold text-white">3</span>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Climb Leaderboard</h3>
                            <p className="text-sm text-gray-400">
                                Real-time leaderboard shows your rank based on P&L and ROI.
                            </p>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-3">
                                <span className="text-2xl font-bold text-white">4</span>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Win Real Money</h3>
                            <p className="text-sm text-gray-400">
                                Top performers win real money prizes distributed after tournament ends!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Leaderboard Modal */}
                {showLeaderboard && selectedTournament && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-700">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{selectedTournament.name}</h2>
                                    <p className="text-gray-400 mt-1">Live Leaderboard</p>
                                </div>
                                <button
                                    onClick={() => setShowLeaderboard(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <Leaderboard rankings={leaderboard} currentUserId={user?.id} />
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-gray-700 flex justify-end">
                                <button
                                    onClick={() => setShowLeaderboard(false)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Team Management Modal */}
                {showTeams && selectedTournament && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-700">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{selectedTournament.name}</h2>
                                    <p className="text-gray-400 mt-1">Team Tournament • {selectedTournament.team_size} players per team</p>
                                </div>
                                <button
                                    onClick={() => setShowTeams(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <TeamList
                                    tournament={selectedTournament}
                                    onCreateTeam={handleCreateTeam}
                                />
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-gray-700 flex justify-end">
                                <button
                                    onClick={() => setShowTeams(false)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Team Modal */}
                {showCreateTeam && selectedTournament && (
                    <CreateTeamModal
                        tournament={selectedTournament}
                        isOpen={showCreateTeam}
                        onClose={() => setShowCreateTeam(false)}
                        onSuccess={handleTeamCreated}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}

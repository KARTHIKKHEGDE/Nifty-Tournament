import React, { useState, useEffect } from 'react';
import { Team, Tournament, TournamentType } from '../../types';
import teamService from '../../services/teamService';

interface TeamListProps {
    tournament: Tournament;
    onTeamSelect?: (team: Team) => void;
    onCreateTeam?: () => void;
}

const TeamList: React.FC<TeamListProps> = ({ tournament, onTeamSelect, onCreateTeam }) => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [myTeam, setMyTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (tournament.tournament_type === TournamentType.TEAM) {
            loadTeams();
            loadMyTeam();
        }
    }, [tournament.id]);

    const loadTeams = async () => {
        try {
            setLoading(true);
            const data = await teamService.getTournamentTeams(tournament.id);
            setTeams(data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load teams');
        } finally {
            setLoading(false);
        }
    };

    const loadMyTeam = async () => {
        try {
            const data = await teamService.getMyTeam(tournament.id);
            setMyTeam(data);
        } catch (err: any) {
            console.error('Failed to load my team:', err);
        }
    };

    const handleJoinTeam = async (teamId: number) => {
        try {
            await teamService.joinTeam(teamId);
            alert('Successfully joined team!');
            loadTeams();
            loadMyTeam();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to join team');
        }
    };

    const handleLeaveTeam = async () => {
        if (!myTeam) return;
        
        if (!confirm('Are you sure you want to leave this team?')) return;

        try {
            await teamService.leaveTeam(myTeam.id);
            alert('Successfully left team');
            setMyTeam(null);
            loadTeams();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to leave team');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* My Team Section */}
            {myTeam && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-green-800 dark:text-green-300">
                                {myTeam.name}
                            </h3>
                            <p className="text-sm text-green-600 dark:text-green-400">Your Team</p>
                        </div>
                        <button
                            onClick={handleLeaveTeam}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                        >
                            Leave Team
                        </button>
                    </div>
                    
                    {myTeam.description && (
                        <p className="text-gray-700 dark:text-gray-300 mb-4">{myTeam.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm mb-4">
                        <span className="text-gray-600 dark:text-gray-400">
                            Captain: <span className="font-semibold text-gray-800 dark:text-gray-200">{myTeam.captain_username}</span>
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                            Members: <span className="font-semibold text-gray-800 dark:text-gray-200">{myTeam.total_members}/{myTeam.max_members}</span>
                        </span>
                        {myTeam.is_full && (
                            <span className="px-2 py-1 bg-green-500 text-white rounded text-xs">Full</span>
                        )}
                    </div>

                    {/* Members List */}
                    <div className="border-t border-green-200 dark:border-green-800 pt-4">
                        <h4 className="font-semibold mb-2 text-green-800 dark:text-green-300">Team Members:</h4>
                        <div className="space-y-2">
                            {myTeam.members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between bg-white dark:bg-gray-800 px-3 py-2 rounded">
                                    <span className="text-gray-800 dark:text-gray-200">{member.username}</span>
                                    <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                                        {member.role}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Available Teams Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                        {myTeam ? 'Other Teams' : 'Available Teams'}
                    </h3>
                    {!myTeam && onCreateTeam && (
                        <button
                            onClick={onCreateTeam}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium"
                        >
                            Create Team
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {teams
                        .filter(team => !myTeam || team.id !== myTeam.id)
                        .map((team) => (
                            <div
                                key={team.id}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => onTeamSelect && onTeamSelect(team)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-bold text-lg text-gray-800 dark:text-white">{team.name}</h4>
                                    {team.is_full && (
                                        <span className="px-2 py-1 bg-gray-400 text-white rounded text-xs">Full</span>
                                    )}
                                </div>

                                {team.description && (
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                                        {team.description}
                                    </p>
                                )}

                                <div className="flex justify-between items-center text-sm">
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400">Captain</p>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{team.captain_username}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-500 dark:text-gray-400">Members</p>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                                            {team.total_members}/{team.max_members}
                                        </p>
                                    </div>
                                </div>

                                {!myTeam && !team.is_full && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleJoinTeam(team.id);
                                        }}
                                        className="w-full mt-3 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-medium"
                                    >
                                        Join Team
                                    </button>
                                )}
                            </div>
                        ))}
                </div>

                {teams.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="text-lg">No teams available yet</p>
                        {!myTeam && (
                            <p className="text-sm mt-2">Be the first to create a team!</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamList;

import React from 'react';
import { TournamentRanking } from '../../types';
import { formatCurrency, formatPercentage, getPriceColor } from '../../utils/formatters';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardProps {
    rankings: TournamentRanking[];
    currentUserId?: number;
}

export default function Leaderboard({ rankings, currentUserId }: LeaderboardProps) {
    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="w-6 h-6 text-yellow-500" />;
            case 2:
                return <Medal className="w-6 h-6 text-gray-400" />;
            case 3:
                return <Award className="w-6 h-6 text-orange-600" />;
            default:
                return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
        }
    };

    const getRankBadgeColor = (rank: number) => {
        switch (rank) {
            case 1:
                return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
            case 2:
                return 'bg-gradient-to-r from-gray-400 to-gray-500';
            case 3:
                return 'bg-gradient-to-r from-orange-500 to-orange-600';
            default:
                return 'bg-gray-700';
        }
    };

    if (rankings.length === 0) {
        return (
            <div className="bg-gray-800 rounded-lg p-12 text-center">
                <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No rankings yet. Be the first to join!</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                    Leaderboard
                </h3>
                <p className="text-blue-100 mt-2">{rankings.length} participants competing</p>
            </div>

            {/* Rankings Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-900">
                        <tr>
                            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                                Rank
                            </th>
                            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                                Trader
                            </th>
                            <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">
                                Total P&L
                            </th>
                            <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">
                                ROI
                            </th>
                            <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">
                                Trades
                            </th>
                            <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">
                                Win Rate
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankings.map((ranking, index) => {
                            const isCurrentUser = ranking.user_id === currentUserId;
                            const winRate = ranking.total_trades > 0
                                ? (ranking.winning_trades / ranking.total_trades) * 100
                                : 0;

                            return (
                                <tr
                                    key={ranking.id}
                                    className={`border-b border-gray-700/50 transition-colors ${isCurrentUser
                                            ? 'bg-blue-500/10 border-blue-500/50'
                                            : 'hover:bg-gray-700/30'
                                        }`}
                                >
                                    {/* Rank */}
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-12 h-12 rounded-lg flex items-center justify-center ${getRankBadgeColor(
                                                    ranking.rank
                                                )}`}
                                            >
                                                {getRankIcon(ranking.rank)}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Trader */}
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                                <span className="text-white font-semibold text-sm">
                                                    {ranking.username.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">
                                                    {ranking.username}
                                                    {isCurrentUser && (
                                                        <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                                                            You
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Total P&L */}
                                    <td className={`py-4 px-6 text-right font-bold text-lg ${getPriceColor(ranking.total_pnl)}`}>
                                        {formatCurrency(ranking.total_pnl)}
                                    </td>

                                    {/* ROI */}
                                    <td className={`py-4 px-6 text-right font-semibold ${getPriceColor(ranking.roi_percentage)}`}>
                                        {formatPercentage(ranking.roi_percentage)}
                                    </td>

                                    {/* Trades */}
                                    <td className="py-4 px-6 text-right text-gray-300">
                                        {ranking.total_trades}
                                    </td>

                                    {/* Win Rate */}
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-24 bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${winRate}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-300 w-12 text-right">
                                                {winRate.toFixed(0)}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Top 3 Highlight */}
            {rankings.length >= 3 && (
                <div className="bg-gray-900 p-6 border-t border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-400 mb-4">Top Performers</h4>
                    <div className="grid grid-cols-3 gap-4">
                        {rankings.slice(0, 3).map((ranking, index) => (
                            <div
                                key={ranking.id}
                                className={`text-center p-4 rounded-lg ${index === 0
                                        ? 'bg-yellow-500/10 border border-yellow-500/30'
                                        : index === 1
                                            ? 'bg-gray-500/10 border border-gray-500/30'
                                            : 'bg-orange-500/10 border border-orange-500/30'
                                    }`}
                            >
                                <div className="mb-2">{getRankIcon(index + 1)}</div>
                                <p className="text-white font-semibold mb-1">{ranking.username}</p>
                                <p className={`text-lg font-bold ${getPriceColor(ranking.total_pnl)}`}>
                                    {formatCurrency(ranking.total_pnl)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

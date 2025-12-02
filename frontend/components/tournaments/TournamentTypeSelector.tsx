import React from 'react';
import { TournamentType } from '../../types';

interface TournamentTypeSelectorProps {
    selectedType: TournamentType;
    onTypeChange: (type: TournamentType) => void;
    teamSize?: number;
    onTeamSizeChange?: (size: number) => void;
}

const TournamentTypeSelector: React.FC<TournamentTypeSelectorProps> = ({
    selectedType,
    onTypeChange,
    teamSize,
    onTeamSizeChange
}) => {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Tournament Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                    {/* Solo Tournament Option */}
                    <div
                        onClick={() => onTypeChange(TournamentType.SOLO)}
                        className={`
                            cursor-pointer border-2 rounded-lg p-4 transition-all
                            ${selectedType === TournamentType.SOLO
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                            }
                        `}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`
                                mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center
                                ${selectedType === TournamentType.SOLO
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-400 dark:border-gray-500'
                                }
                            `}>
                                {selectedType === TournamentType.SOLO && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                                    Solo Tournament
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Individual players compete against each other
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        Perfect for individual traders
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Team Tournament Option */}
                    <div
                        onClick={() => onTypeChange(TournamentType.TEAM)}
                        className={`
                            cursor-pointer border-2 rounded-lg p-4 transition-all
                            ${selectedType === TournamentType.TEAM
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
                            }
                        `}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`
                                mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center
                                ${selectedType === TournamentType.TEAM
                                    ? 'border-purple-500 bg-purple-500'
                                    : 'border-gray-400 dark:border-gray-500'
                                }
                            `}>
                                {selectedType === TournamentType.TEAM && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                                    Team Tournament
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Teams of players compete together
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        Collaborate with teammates
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Size Input (shown only for team tournaments) */}
            {selectedType === TournamentType.TEAM && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <label className="block text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">
                        Team Size *
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="number"
                            value={teamSize || 2}
                            onChange={(e) => onTeamSizeChange && onTeamSizeChange(parseInt(e.target.value))}
                            min={2}
                            max={10}
                            required
                            className="w-32 px-4 py-2 border border-purple-300 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                        <span className="text-sm text-purple-700 dark:text-purple-300">
                            members per team
                        </span>
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                        Each team must have exactly {teamSize || 2} members to participate. Teams will compete based on their combined performance.
                    </p>
                </div>
            )}
        </div>
    );
};

export default TournamentTypeSelector;

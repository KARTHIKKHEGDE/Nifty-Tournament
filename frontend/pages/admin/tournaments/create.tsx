/**
 * Create Tournament Page - Multi-step tournament creation wizard
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import { useAdminStore } from '../../../stores/adminStore';
import TournamentTypeSelector from '../../../components/tournaments/TournamentTypeSelector';
import { TournamentType } from '../../../types';
import toast from 'react-hot-toast';

const CreateTournamentPage = () => {
    const router = useRouter();
    const { createTournament } = useAdminStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        tournament_type: TournamentType.SOLO,
        team_size: 2,
        entry_fee: 0,
        prize_pool: 0,
        starting_balance: 100000,
        max_participants: null as number | null,
        start_date: '',
        end_date: '',
        registration_deadline: '',
        rules: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name.includes('fee') || name.includes('pool') || name.includes('balance') || name === 'max_participants'
                ? value === '' ? null : parseFloat(value)
                : value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.start_date || !formData.end_date) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!formData.prize_pool || formData.prize_pool <= 0) {
            toast.error('Prize pool must be greater than 0');
            return;
        }

        if (new Date(formData.start_date) >= new Date(formData.end_date)) {
            toast.error('End date must be after start date');
            return;
        }

        if (formData.registration_deadline && new Date(formData.registration_deadline) >= new Date(formData.start_date)) {
            toast.error('Registration deadline must be before start date');
            return;
        }

        if (formData.tournament_type === TournamentType.TEAM && (!formData.team_size || formData.team_size < 2)) {
            toast.error('Team size must be at least 2 for team tournaments');
            return;
        }

        // Convert datetime-local strings to ISO format with timezone
        const tournamentData = {
            name: formData.name,
            description: formData.description || null,
            tournament_type: formData.tournament_type,
            team_size: formData.tournament_type === TournamentType.TEAM ? formData.team_size : null,
            entry_fee: Number(formData.entry_fee) || 0,
            prize_pool: Number(formData.prize_pool),
            starting_balance: Number(formData.starting_balance) || 100000,
            max_participants: formData.max_participants ? Number(formData.max_participants) : null,
            start_date: new Date(formData.start_date).toISOString(),
            end_date: new Date(formData.end_date).toISOString(),
            registration_deadline: formData.registration_deadline 
                ? new Date(formData.registration_deadline).toISOString() 
                : new Date(formData.start_date).toISOString(),
            rules: formData.rules || null,
        };

        setIsSubmitting(true);
        const success = await createTournament(tournamentData);
        setIsSubmitting(false);

        if (success) {
            router.push('/admin/tournaments');
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-6 pb-12">
                {/* Header */}
                <div>
                    <button
                        onClick={() => router.push('/admin/tournaments')}
                        className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Tournaments
                    </button>
                    <h1 className="text-3xl font-bold text-white">Create New Tournament</h1>
                    <p className="mt-2 text-gray-400">Fill in the details to create a new tournament</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tournament Type */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <TournamentTypeSelector
                            selectedType={formData.tournament_type}
                            onTypeChange={(type) => setFormData({ ...formData, tournament_type: type })}
                            teamSize={formData.team_size}
                            onTeamSizeChange={(size) => setFormData({ ...formData, team_size: size })}
                        />
                    </div>

                    {/* Basic Information */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Basic Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Tournament Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                    placeholder="e.g., Weekly Trading Championship"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                                    placeholder="Describe the tournament..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financial Details */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Financial Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Entry Fee (₹)
                                </label>
                                <input
                                    type="number"
                                    name="entry_fee"
                                    value={formData.entry_fee}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Prize Pool (₹)
                                </label>
                                <input
                                    type="number"
                                    name="prize_pool"
                                    value={formData.prize_pool}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Starting Balance (₹)
                                </label>
                                <input
                                    type="number"
                                    name="starting_balance"
                                    value={formData.starting_balance}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    required
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                    placeholder="100000.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Participant Settings */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Participant Settings</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Max Participants (Optional)
                            </label>
                            <input
                                type="number"
                                name="max_participants"
                                value={formData.max_participants || ''}
                                onChange={handleChange}
                                min="1"
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                placeholder="Leave empty for unlimited"
                            />
                            <p className="mt-1 text-sm text-gray-400">
                                Leave empty to allow unlimited participants
                            </p>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Schedule</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Start Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    End Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Registration Deadline
                                </label>
                                <input
                                    type="datetime-local"
                                    name="registration_deadline"
                                    value={formData.registration_deadline}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rules */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Rules & Guidelines</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Tournament Rules
                            </label>
                            <textarea
                                name="rules"
                                value={formData.rules}
                                onChange={handleChange}
                                rows={6}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                                placeholder="Enter tournament rules and guidelines..."
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => router.push('/admin/tournaments')}
                            className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating...
                                </>
                            ) : (
                                'Create Tournament'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
};

export default CreateTournamentPage;

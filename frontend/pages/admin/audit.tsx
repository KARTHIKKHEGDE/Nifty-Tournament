/**
 * Audit Log Page - View system-wide admin actions
 */

import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAdminStore } from '../../stores/adminStore';
import * as adminService from '../../services/adminService';
import toast from 'react-hot-toast';

interface AuditLogEntry {
    id: number;
    admin_user_id: number;
    action_type: string;
    target_type: string;
    target_id: number;
    description: string;
    ip_address: string;
    created_at: string;
    admin_username?: string;
}

const AuditLogPage = () => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action_type: '',
        target_type: '',
    });

    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            // We'll use the service directly since this might not be in the store yet
            const response = await adminService.getAuditLog({ limit: 100, offset: 0 }); // Fetch last 100 logs
            if (response && response.actions && Array.isArray(response.actions)) {
                setLogs(response.actions);
            } else {
                console.error('Invalid response format:', response);
                setLogs([]);
                toast.error('Invalid response format from server');
            }
        } catch (error: any) {
            console.error('Failed to fetch audit logs:', error);
            setLogs([]); // Ensure logs is always an array
            toast.error(error?.response?.data?.detail || 'Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditLogs();
    }, []);

    const getActionColor = (action: string) => {
        if (action.includes('DELETE') || action.includes('REMOVE') || action.includes('BAN')) return 'text-red-400';
        if (action.includes('CREATE') || action.includes('ADD')) return 'text-green-400';
        if (action.includes('UPDATE') || action.includes('EDIT')) return 'text-blue-400';
        return 'text-gray-300';
    };

    const filteredLogs = logs.filter(log => {
        // Skip invalid entries
        if (!log || !log.id || !log.action_type || !log.target_type) return false;
        if (filters.action_type && !log.action_type.includes(filters.action_type)) return false;
        if (filters.target_type && !log.target_type.includes(filters.target_type)) return false;
        return true;
    });

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white">Audit Log</h1>
                    <p className="mt-2 text-gray-400">
                        Track all administrative actions and system changes
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs text-gray-400 mb-1">Filter by Action</label>
                        <select
                            value={filters.action_type}
                            onChange={(e) => setFilters({ ...filters, action_type: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="">All Actions</option>
                            <option value="CREATE">Create</option>
                            <option value="UPDATE">Update</option>
                            <option value="DELETE">Delete</option>
                            <option value="REMOVE">Remove</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs text-gray-400 mb-1">Filter by Target</label>
                        <select
                            value={filters.target_type}
                            onChange={(e) => setFilters({ ...filters, target_type: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="">All Targets</option>
                            <option value="TOURNAMENT">Tournament</option>
                            <option value="USER">User</option>
                            <option value="PARTICIPANT">Participant</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={fetchAuditLogs}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <p className="mt-4 text-gray-400">Loading audit logs...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-400">No audit logs found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Timestamp
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Admin
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Action
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Target
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            IP Address
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-300">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-white mr-2">
                                                        {log.admin_username ? log.admin_username.charAt(0).toUpperCase() : 'A'}
                                                    </div>
                                                    <span className="text-sm font-medium text-white">
                                                        {log.admin_username || `ID: ${log.admin_user_id}`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-sm font-bold ${getActionColor(log.action_type)}`}>
                                                    {log.action_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-semibold text-gray-300 bg-gray-600 rounded-full">
                                                    {log.target_type} {log.target_id ? `#${log.target_id}` : ''}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-300 truncate max-w-xs" title={log.description}>
                                                    {log.description}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="text-sm text-gray-500 font-mono">
                                                    {log.ip_address || 'N/A'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AuditLogPage;

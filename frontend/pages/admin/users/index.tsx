/**
 * Admin Users List - View and manage all users
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import { useAdminStore } from '../../../stores/adminStore';

const UsersPage = () => {
    const router = useRouter();
    const { users, loading, fetchUsers, activateUser, deactivateUser, makeAdmin, revokeAdmin, deleteUser } = useAdminStore();
    const [filters, setFilters] = useState({
        search: '',
        is_active: undefined as boolean | undefined,
        is_admin: undefined as boolean | undefined,
    });

    useEffect(() => {
        fetchUsers(filters);
    }, [filters]);

    const handleSearch = (search: string) => {
        setFilters({ ...filters, search });
    };

    const handleDelete = async (userId: number, username: string) => {
        if (confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
            await deleteUser(userId);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Users</h1>
                        <p className="mt-2 text-gray-400">Manage all platform users</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                    <input
                        type="text"
                        placeholder="Search by username or email..."
                        value={filters.search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="flex-1 min-w-[300px] px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                    <select
                        value={filters.is_active === undefined ? '' : filters.is_active.toString()}
                        onChange={(e) => setFilters({ ...filters, is_active: e.target.value === '' ? undefined : e.target.value === 'true' })}
                        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                    <select
                        value={filters.is_admin === undefined ? '' : filters.is_admin.toString()}
                        onChange={(e) => setFilters({ ...filters, is_admin: e.target.value === '' ? undefined : e.target.value === 'true' })}
                        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                        <option value="">All Roles</option>
                        <option value="true">Admins</option>
                        <option value="false">Users</option>
                    </select>
                </div>

                {/* Users Table */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    {loading.users ? (
                        <div className="p-8 text-center">
                            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <p className="mt-4 text-gray-400">Loading users...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-400">No users found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Stats
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Balance
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Joined
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-white">{user.username}</p>
                                                    <p className="text-sm text-gray-400">{user.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.is_active ? (
                                                    <span className="px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 text-xs font-semibold text-white bg-red-500 rounded-full">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.is_admin ? (
                                                    <span className="px-3 py-1 text-xs font-semibold text-white bg-purple-500 rounded-full">
                                                        Admin
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 text-xs font-semibold text-white bg-gray-600 rounded-full">
                                                        User
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-400">
                                                    <p>{user.tournaments_joined} tournaments</p>
                                                    <p>{user.total_trades} trades</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-white">₹{user.current_balance.toLocaleString()}</p>
                                                    <p className={`text-sm ${user.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        P&L: ₹{user.total_pnl.toLocaleString()}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-400">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => router.push(`/admin/users/${user.id}`)}
                                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                                                    >
                                                        View
                                                    </button>
                                                    {user.is_active ? (
                                                        <button
                                                            onClick={() => deactivateUser(user.id)}
                                                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded transition-colors"
                                                        >
                                                            Deactivate
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => activateUser(user.id)}
                                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
                                                        >
                                                            Activate
                                                        </button>
                                                    )}
                                                    {!user.is_admin ? (
                                                        <button
                                                            onClick={() => makeAdmin(user.id)}
                                                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition-colors"
                                                        >
                                                            Make Admin
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => revokeAdmin(user.id)}
                                                            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded transition-colors"
                                                        >
                                                            Revoke Admin
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(user.id, user.username)}
                                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
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

export default UsersPage;

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import styles from '@/styles/adminUsers.module.css';
import UserDetailsModal from '@/components/userDetailsModal';
import { fetchAdminUsers, AddIcon, SearchIcon } from '@/constants';

const USERS_PER_PAGE = 15;

export default function UsersPage() {
    const [currentUsers, setCurrentUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    // --- Data Fetching ---
    const getUsers = useCallback(async (page = 1, search = '') => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError("Authentication required.");
            setLoading(false);
            return;
        }

        try {
            const apiUrl = new URL(fetchAdminUsers);
            apiUrl.searchParams.append('page', page);
            apiUrl.searchParams.append('limit', USERS_PER_PAGE);
            if (search) {
                apiUrl.searchParams.append('search', search);
            }

            const response = await fetch(apiUrl.toString(), {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to fetch users' }));
                throw new Error(errorData.message || 'Failed to fetch users');
            }

            const data = await response.json();
            setCurrentUsers(data.users || []);
            setTotalUsers(data.totalUsers || 0);
            setTotalPages(data.totalPages || 1);
            setError(null);

        } catch (err) {
            setError(err.message);
            setCurrentUsers([]);
            setTotalUsers(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            getUsers(currentPage, searchTerm);
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [currentPage, searchTerm, getUsers]);

    const handleAddAdmin = () => alert('Implement Add Admin functionality');

    const handleDeleteUser = async (userId, userName) => {
        if (window.confirm(`Are you sure you want to delete user: ${userName}?`)) {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Authentication error. Please log in again.");
                return;
            }

            const deleteUrl = `${fetchAdminUsers}/${userId}`;
            const toastId = toast.loading('Deleting user...');

            try {
                const response = await fetch(deleteUrl, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: `Failed to delete user (Status: ${response.status})` }));
                    throw new Error(errorData.message || `Failed to delete user (Status: ${response.status})`);
                }

                toast.success('User deleted successfully.', { id: toastId });

                if (currentUsers.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1); 
                } else {
                    getUsers(currentPage, searchTerm); 
                }

            } catch (error) {
                toast.error(`Error: ${error.message}`, { id: toastId });
                console.error("Delete failed:", error);
            }
        }
    };

    const handleViewUser = (userId) => {
        const userToShow = currentUsers.find(user => user.id === userId);
        setSelectedUser(userToShow);
    };
    const handleCloseModal = () => setSelectedUser(null);
    const handleSearchChange = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };
    const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
    const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

    // --- Render States ---
    if (loading && currentUsers.length === 0) {
        return (
            <div className={styles.usersContainer}>
                <header className={styles.pageHeader}><h1>Manage Users</h1></header>
                <p className={styles.statusMessage}>Loading user data...</p>
            </div>
        );
    }
    if (error) {
         return (
             <div className={styles.usersContainer}>
                 <header className={styles.pageHeader}><h1>Manage Users</h1></header>
                 <p className={styles.errorMessage}>Error: {error}</p>
             </div>
         );
    }

    // --- Main Render ---
    return (
        <>
            <div className={styles.usersContainer}>
                <header className={styles.pageHeader}>
                    <h1>Manage Users ({totalUsers})</h1>
                    <div className={styles.headerActions}>
                         <div className={styles.searchBar}>
                            <SearchIcon />
                            <input
                                type="text"
                                placeholder="Search by name, email, role..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>
                        <button className={styles.addButton} onClick={handleAddAdmin}>
                           <AddIcon/> Add New Admin
                        </button>
                    </div>
                </header>

                <div className={styles.usersTableContainer}>
                    <table className={styles.usersTable}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Subscribed</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.full_name || 'N/A'}</td>
                                    <td>{user.email || 'N/A'}</td>
                                    <td>
                                        <span className={`${styles.roleBadge} ${styles[user.role?.toLowerCase() || '']}`}>
                                            {user.role || 'N/A'}
                                        </span>
                                    </td>
                                    <td>{user.subscription_status ? 'Pro+' : 'Inactive'}</td>
                                    <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
                                    <td className={styles.actionButtons}>
                                      <button onClick={() => handleViewUser(user.id)} className={styles.viewButton}>
                                        View
                                      </button>
                                      {user.role !== 'admin' && ( 
                                        <button onClick={() => handleDeleteUser(user.id, user.full_name)} className={styles.deleteButton}>
                                          Delete
                                        </button>
                                      )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {totalUsers === 0 && !loading && <p className={styles.noUsers}>No users found{searchTerm ? ' matching your search' : ''}.</p>}
                </div>

                {totalPages > 1 && (
                    <div className={styles.pagination}>
                        <span>Page {currentPage} of {totalPages} ({totalUsers} users)</span>
                        <div className={styles.paginationButtons}>
                            <button onClick={handlePrevPage} disabled={currentPage === 1 || loading}>
                                Previous
                            </button>
                            <button onClick={handleNextPage} disabled={currentPage === totalPages || loading}>
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <UserDetailsModal user={selectedUser} onClose={handleCloseModal} />
        </>
    );
}
'use client';

import React, { useState, useEffect, useCallback, useContext } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from '@/styles/adminJobs.module.css';
import { fetchAdminJobs, fetchAdminDeleteJob, SearchIcon, ViewIcon, EditIcon, DeleteIcon } from '@/constants';
import { AuthContext } from '@/context/AuthContext';

const JOBS_PER_PAGE = 15;

export default function JobsPage() {
    const [currentJobs, setCurrentJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalJobs, setTotalJobs] = useState(0);
    const { user, loading: authLoading, logout } = useContext(AuthContext); 
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const getJobs = useCallback(async (page = 1, search = '') => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError("Authentication required.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const apiUrl = new URL(fetchAdminJobs);
            apiUrl.searchParams.append('page', page);
            apiUrl.searchParams.append('limit', JOBS_PER_PAGE);
            if (search) {
                apiUrl.searchParams.append('search', search);
            }

            const response = await fetch(apiUrl.toString(), {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to fetch jobs' }));
                throw new Error(errorData.message || 'Failed to fetch jobs');
            }

            const data = await response.json();
            setCurrentJobs(data.jobs || []);
            setTotalJobs(data.totalJobs || 0);
            setTotalPages(data.totalPages || 1);
            setError(null);

        } catch (err) {
            setError(err.message);
            setCurrentJobs([]);
            setTotalJobs(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            getJobs(currentPage, searchTerm);
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [currentPage, searchTerm, getJobs]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };
    const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
    const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

    const handleDeleteJob = async (jobId, jobTitle) => {
        if (window.confirm(`Are you sure you want to delete job: ${jobTitle}?`)) {
            const token = localStorage.getItem('token');

            if (token) {
                toast.error("Authentication error. Please log in again.");
                return;
            }
            const deleteUrl = `${fetchAdminJobs}/${jobId}`;
            console.log("Delete URL:", deleteUrl);

            const toastId = toast.loading('Deleting job...');

            try {
                const response = await fetch(deleteUrl, { 
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                console.log("API Response Status:", response.status); 

                if (!response.ok) {
                    let errorData = { message: `HTTP error! Status: ${response.status}` };
                    try {
                        errorData = await response.json();
                    } catch (parseError) {
                        console.error("Could not parse error JSON:", parseError);
                    }
                    console.error("API Error Data:", errorData);
                    throw new Error(errorData.message || `Failed to delete job (Status: ${response.status})`);
                }

                let successData = {};
                try {
                   successData = await response.json();
                   console.log("API Success Data:", successData);
                } catch(e){
                   console.log("No JSON body in success response, proceeding.");
                }


                toast.success(successData.message || 'Job deleted successfully.', { id: toastId });
                console.log("Deletion successful, refreshing job list..."); 
                getJobs(currentPage, searchTerm);

            } catch (error) {
                toast.error(`Error: ${error.message}`, { id: toastId });
                console.error("Delete failed:", error);
            }
        } else {
            console.log("User cancelled delete action.");
        }
    };

    const handleEditJob = (jobId) => {
        alert(`Implement Edit job functionality for ID: ${jobId}`);
    };

    // --- Render States ---
    if (loading && currentJobs.length === 0) {
        return (
            <div className={styles.jobsContainer}>
                <header className={styles.pageHeader}><h1>Manage Job Listings</h1></header>
                <p className={styles.statusMessage}>Loading jobs...</p>
            </div>
        );
    }
    if (error) {
        return (
            <div className={styles.jobsContainer}>
                <header className={styles.pageHeader}><h1>Manage Job Listings</h1></header>
                <p className={styles.errorMessage}>Error: {error}</p>
            </div>
        );
    }

    // --- Main Render ---
    return (
        <div className={styles.jobsContainer}>
            <header className={styles.pageHeader}>
                <h1>Manage Job Listings ({totalJobs})</h1>
                <div className={styles.searchBar}>
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder="Search by title, company, location..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
            </header>

            <div className={styles.jobsTableContainer}>
                <table className={styles.jobsTable}>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Company</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Date Posted</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentJobs.map((job) => (
                            <tr key={job.id}>
                                <td>{job.title || 'N/A'}</td>
                                <td>{job.company_name || 'N/A'}</td>
                                <td>{job.job_location || 'N/A'}</td>
                                <td>
                                    <span className={`${styles.statusBadge} ${job.status === 'active' ? styles.active : styles.inactive}`}>
                                        {job.status || 'N/A'}
                                    </span>
                                </td>
                                <td>{job.date_posted ? new Date(job.date_posted).toLocaleDateString() : 'N/A'}</td>
                                <td className={styles.actionButtons}>
                                    <Link href={`/job/${job.slug}`} target="_blank" className={styles.viewButton} aria-label={`View ${job.title}`} title="View Live Job">
                                        <ViewIcon size={16}/>
                                    </Link>
                                    <button onClick={() => handleEditJob(job.id)} className={styles.editButton} aria-label={`Edit ${job.title}`} title="Edit Job">
                                        <EditIcon size={16}/>
                                    </button>
                                    <button onClick={() => handleDeleteJob(job.id, job.title)} className={styles.deleteButton} aria-label={`Delete ${job.title}`} title="Delete Job">
                                        <DeleteIcon size={16}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {totalJobs === 0 && !loading && <p className={styles.noResults}>No jobs found{searchTerm ? ' matching your search' : ''}.</p>}
            </div>

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <span>Page {currentPage} of {totalPages} ({totalJobs} jobs)</span>
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
    );
}
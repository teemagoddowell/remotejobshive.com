'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast'; 
import styles from '@/styles/adminCompanies.module.css';
import { fetchAdminCompanies } from '@/constants'; 
import { EditIcon, DeleteIcon, SearchIcon, ViewIcon } from '@/constants';

const COMPANIES_PER_PAGE = 15;

export default function CompaniesPage() {
    // State for fetched data
    const [currentCompanies, setCurrentCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State for UI controls
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCompanies, setTotalCompanies] = useState(0);

    // --- Data Fetching ---
    const getCompanies = useCallback(async (page = 1, search = '') => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError("Authentication required.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const apiUrl = new URL(fetchAdminCompanies);
            apiUrl.searchParams.append('page', page);
            apiUrl.searchParams.append('limit', COMPANIES_PER_PAGE);
            if (search) {
                apiUrl.searchParams.append('search', search);
            }
            console.log(apiUrl);

            const response = await fetch(apiUrl.toString(), {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to fetch companies' }));
                throw new Error(errorData.message || 'Failed to fetch companies');
            }

            const data = await response.json();
            setCurrentCompanies(data.companies || []);
            setTotalCompanies(data.totalCompanies || 0);
            setTotalPages(data.totalPages || 1);
            setError(null);

        } catch (err) {
            setError(err.message);
            setCurrentCompanies([]);
            setTotalCompanies(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            getCompanies(currentPage, searchTerm);
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [currentPage, searchTerm, getCompanies]);

    // --- Handlers ---
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };
    const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
    const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

    const handleDeleteCompany = async (companyId, companyName) => {
        if (window.confirm(`Are you sure you want to delete company: ${companyName}? This may fail if jobs are still associated with it.`)) {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Authentication error. Please log in again.");
                return;
            }

            const deleteUrl = `${fetchAdminCompanies}/${companyId}`;
            const toastId = toast.loading('Deleting company...');

            try {
                // ⭐ --- API Call for DELETE --- ⭐
                const response = await fetch(deleteUrl, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: `Failed to delete (Status: ${response.status})` }));
                    throw new Error(errorData.message || `Failed to delete (Status: ${response.status})`);
                }

                toast.success('Company deleted successfully.', { id: toastId });

                if (currentCompanies.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                } else {
                    getCompanies(currentPage, searchTerm);
                }

            } catch (error) {
                toast.error(`Error: ${error.message}`, { id: toastId });
                console.error("Delete failed:", error);
            }
        }
    };

    const handleEditCompany = (companyId) => {
        alert(`Implement Edit company functionality for ID: ${companyId}`);
    };

    // --- Render States ---
    if (loading && currentCompanies.length === 0) {
        return (
            <div className={styles.companiesContainer}>
                <header className={styles.pageHeader}><h1>Manage Companies</h1></header>
                <p className={styles.statusMessage}>Loading companies...</p>
            </div>
        );
    }
    if (error) {
         return (
             <div className={styles.companiesContainer}>
                 <header className={styles.pageHeader}><h1>Manage Companies</h1></header>
                 <p className={styles.errorMessage}>Error: {error}</p>
             </div>
         );
    }

    // --- Main Render ---
    return (
        <div className={styles.companiesContainer}>
            <header className={styles.pageHeader}>
                <h1>Manage Companies ({totalCompanies})</h1>
                <div className={styles.searchBar}>
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder="Search by name or website..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
            </header>

            <div className={styles.companiesTableContainer}>
                <table className={styles.companiesTable}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Website</th>
                            <th>Jobs Posted</th>
                            <th>Date Added</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentCompanies.map((company) => (
                            <tr key={company.id}>
                                <td>{company.name}</td>
                                <td><a href={company.website_url || '#'} target="_blank" rel="noopener noreferrer">{company.website_url || 'N/A'}</a></td>
                                <td>{company.job_count}</td>
                                <td>{new Date(company.created_at).toLocaleDateString()}</td>
                                <td className={styles.actionButtons}>
                                    <Link href={`/company/${company.slug}`} target="_blank" className={styles.viewButton} aria-label={`View ${company.name}`} title="View Live Company Page">
                                        <ViewIcon size={16}/>
                                    </Link>
                                    <button onClick={() => handleEditCompany(company.id)} className={styles.editButton} aria-label={`Edit ${company.name}`} title="Edit Company">
                                        <EditIcon size={16}/>
                                    </button>
                                    <button onClick={() => handleDeleteCompany(company.id, company.name)} className={styles.deleteButton} aria-label={`Delete ${company.name}`} title="Delete Company">
                                        <DeleteIcon size={16}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {totalCompanies === 0 && !loading && <p className={styles.noResults}>No companies found{searchTerm ? ' matching your search' : ''}.</p>}
            </div>

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <span>Page {currentPage} of {totalPages} ({totalCompanies} companies)</span>
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
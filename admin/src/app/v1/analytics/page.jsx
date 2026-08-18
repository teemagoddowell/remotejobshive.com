'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from '@/styles/adminAnalytics.module.css';
import { 
    fetchAdminAnalyticsStats, 
    fetchAdminAnalyticsGuestVisitors, 
    fetchAdminAnalyticsVisitorDetails, 
    fetchAdminAnalyticsUserVisitors, 
    SortIcon,
    CloseIcon,
    UserIcon,
    GuestIcon,
    PageViewIcon,
    ApplyIcon
} from '@/constants';
import toast from 'react-hot-toast';


const StatCard = ({ title, value, icon }) => (
    <div className={styles.statCard}>
        <div className={styles.statIcon}>{icon}</div>
        <div className={styles.statContent}>
            <div className={styles.statValue}>{value || '0'}</div>
            <div className={styles.statLabel}>{title}</div>
        </div>
    </div>
);

const PaginationControls = ({ currentPage, totalPages, onPageChange, isLoading }) => {
    if (totalPages <= 1) return null;
    return (
        <div className={styles.pagination}>
            <button 
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
            >
                Previous
            </button>
            <span>
                Page {currentPage} of {totalPages}
            </span>
            <button 
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
            >
                Next
            </button>
        </div>
    );
};

const VisitorsTable = ({ title, data, onSort, onVisitorClick, sortDirection }) => (
    <div className={styles.tableContainer}>
        <h2>{title}</h2>
        <table className={styles.visitorsTable}>
            <thead>
                <tr>
                    <th>Visitor</th>
                    <th>Page Views</th>
                    <th className={styles.sortableHeader} onClick={onSort} title={`Sort by Last Seen ${sortDirection === 'desc' ? 'ASC' : 'DESC'}`}>
                        Last Seen <SortIcon />
                    </th>
                </tr>
            </thead>
            <tbody>
                {data && data.map((visitor) => (
                    <tr key={visitor.id || visitor.visitor_ip} onClick={() => onVisitorClick(visitor)}>
                        <td data-label="Visitor">{visitor.full_name ? visitor.full_name : visitor.visitor_ip}</td>
                        <td data-label="Page Views">{visitor.page_views}</td>
                        <td data-label="Last Seen">{new Date(visitor.last_seen).toLocaleString()}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        {data && data.length === 0 && <p className={styles.noData}>No data to display.</p>}
    </div>
);

const ActivitySidebar = ({ visitor, onClose, token }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!visitor) return;
        
        const fetchDetails = async () => {
            setLoading(true);
            setError(null);
            const url = new URL(fetchAdminAnalyticsVisitorDetails);
            if (visitor.id) {
                url.searchParams.append('userId', visitor.id);
            } else if (visitor.visitor_ip) {
                url.searchParams.append('ip', visitor.visitor_ip);
            } else {
                setError("Invalid visitor data.");
                setLoading(false);
                return;
            }
            
            try {
                const res = await fetch(url.toString(), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Could not fetch details.");
                const data = await res.json();
                setEvents(data);
            } catch (err) {
                setError(err.message);
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [visitor, token]);

    return (
        <div className={styles.sidebar}>
            <button className={styles.closeButton} onClick={onClose} aria-label="Close details"><CloseIcon /></button>
            <h3>Activity For:</h3>
            <h4>{visitor.full_name || `Guest (${visitor.visitor_ip})`}</h4>
            {visitor.email && (
                <p className={styles.sidebarEmail}>{visitor.email}</p>
            )}
            
            {loading && <p>Loading events...</p>}
            {error && <p className={styles.errorMessage}>Error: {error}</p>}
            {!loading && !error && (
                <ul className={styles.eventList}>
                    {events.length === 0 && <li className={styles.eventItem}>No activity recorded.</li>}
                    {events.map((event, index) => (
                        <li key={event.id || index} className={styles.eventItem}>
                            <span className={`${styles.eventType} ${styles[event.event_type.toLowerCase()]}`}>
                                {event.event_type.replace('_', ' ')}
                            </span>
                            <span className={styles.eventPage}>{event.page_visited}</span>
                            {event.event_type === 'APPLY_CLICK' && 
                                <span className={styles.eventJob}>Job ID: {event.job_id}</span>
                            }
                            <span className={styles.eventTime}>{new Date(event.created_at).toLocaleString()}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default function AnalyticsPage() {
    const [stats, setStats] = useState(null);
    const [statsRange, setStatsRange] = useState('all');
    const [userVisitors, setUserVisitors] = useState([]);
    const [guestVisitors, setGuestVisitors] = useState([]);
    const [userSort, setUserSort] = useState('desc');
    const [guestSort, setGuestSort] = useState('desc');
    const [selectedVisitor, setSelectedVisitor] = useState(null);
    const [loading, setLoading] = useState({ stats: true, users: true, guests: true });
    const [error, setError] = useState(null);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const [userPage, setUserPage] = useState(1);
    const [userTotalPages, setUserTotalPages] = useState(1);
    const [guestPage, setGuestPage] = useState(1);
    const [guestTotalPages, setGuestTotalPages] = useState(1);

    const dateRanges = [
        { label: 'All Time', value: 'all' },
        { label: 'Today', value: 'today' },
        { label: '1 Day', value: '1d' },
        { label: '7 Days', value: '7d' },
        { label: '30 Days', value: '30d' },
        { label: '1 Year', value: '1y' },
    ];

    const fetchStats = useCallback(async (range) => {
        if (!token) return;
        setLoading(prev => ({ ...prev, stats: true }));
        try {
            const res = await fetch(`${fetchAdminAnalyticsStats}?range=${range}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch stats.");
            setStats(await res.json());
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(prev => ({ ...prev, stats: false }));
        }
    }, [token]);

    const fetchUsers = useCallback(async (sort, page, range) => { 
        if (!token) return;
        setLoading(prev => ({ ...prev, users: true }));
        try {
            const res = await fetch(`${fetchAdminAnalyticsUserVisitors}?sort=${sort}&page=${page}&range=${range}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch users.");
            const data = await res.json();
            setUserVisitors(data.visitors || []);
            setUserTotalPages(data.totalPages || 1);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(prev => ({ ...prev, users: false }));
        }
    }, [token]);
    
    const fetchGuests = useCallback(async (sort, page, range) => {
        if (!token) return;
        setLoading(prev => ({ ...prev, guests: true }));
        try {
            const res = await fetch(`${fetchAdminAnalyticsGuestVisitors}?sort=${sort}&page=${page}&range=${range}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch guests.");
            const data = await res.json(); 
            setGuestVisitors(data.visitors || []);
            setGuestTotalPages(data.totalPages || 1);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(prev => ({ ...prev, guests: false }));
        }
    }, [token]);

    useEffect(() => {
        if (!token) {
            setError("Authentication required.");
            setLoading({ stats: false, users: false, guests: false });
            return;
        }
        fetchStats('all');
        fetchUsers('desc', 1, 'all');
        fetchGuests('desc', 1, 'all');
    }, [token, fetchStats, fetchUsers, fetchGuests]);

    const handleRangeChange = (e) => {
        const newRange = e.target.value;
        setStatsRange(newRange);
        fetchStats(newRange);
        
        setUserPage(1);
        setGuestPage(1);
        fetchUsers(userSort, 1, newRange);
        fetchGuests(guestSort, 1, newRange);
    };

    const handleSort = (table) => {
        if (table === 'users') {
            const newSort = userSort === 'desc' ? 'asc' : 'desc';
            setUserSort(newSort);
            setUserPage(1);
            fetchUsers(newSort, 1, statsRange);
        } else {
            const newSort = guestSort === 'desc' ? 'asc' : 'desc';
            setGuestSort(newSort);
            setGuestPage(1);
            fetchGuests(newSort, 1, statsRange);
        }
    };

    const handleUserPageChange = (newPage) => {
        setUserPage(newPage);
        fetchUsers(userSort, newPage, statsRange);
    };

    const handleGuestPageChange = (newPage) => {
        setGuestPage(newPage);
        fetchGuests(guestSort, newPage, statsRange);
    };

    if (error) return <p className={styles.errorMessage}>Error: {error}</p>;

    if (loading.stats || loading.users || loading.guests) {
        return (
            <div className={styles.analyticsContainer}>
                <header className={styles.pageHeader}>
                    <h1>Analytics Dashboard</h1>
                    <p>Loading analytics data...</p>
                </header>
            </div>
        );
    }

    return (
        <div className={`${styles.analyticsContainer} ${selectedVisitor ? styles.sidebarOpen : ''}`}>
            <div className={styles.mainContent}>
                <header className={styles.pageHeader}>
                    <h1>Analytics Dashboard</h1>
                    <div className={styles.headerControls}>
                        <label htmlFor="dateRange">Stats for:</label>
                        <select id="dateRange" value={statsRange} onChange={handleRangeChange} className={styles.dateSelector}>
                            {dateRanges.map(range => (
                                <option key={range.value} value={range.value}>{range.label}</option>
                            ))}
                        </select>
                    </div>
                </header>

                <div className={styles.statsGrid}>
                    <StatCard title="Registered User Visits" value={stats?.total_user_visits} icon={<UserIcon />} />
                    <StatCard title="Guest Visits" value={stats?.total_guest_visits} icon={<GuestIcon />} />
                    <StatCard title="Total Page Views" value={stats?.total_page_views} icon={<PageViewIcon />} />
                    <StatCard title="Total 'Apply' Clicks" value={stats?.total_apply_clicks} icon={<ApplyIcon />} />
                </div>

                <div className={styles.tablesGrid}>
                    <div className={styles.tableWithPagination}>
                        <VisitorsTable
                            title="Registered User Visits"
                            data={userVisitors}
                            onSort={() => handleSort('users')}
                            onVisitorClick={setSelectedVisitor}
                            sortDirection={userSort}
                        />
                        <PaginationControls 
                            currentPage={userPage}
                            totalPages={userTotalPages}
                            onPageChange={handleUserPageChange}
                            isLoading={loading.users}
                        />
                    </div>
                    
                    <div className={styles.tableWithPagination}>
                        <VisitorsTable
                            title="Guest Visits (by IP)"
                            data={guestVisitors}
                            onSort={() => handleSort('guests')}
                            onVisitorClick={setSelectedVisitor}
                            sortDirection={guestSort}
                        />
                         <PaginationControls 
                            currentPage={guestPage}
                            totalPages={guestTotalPages}
                            onPageChange={handleGuestPageChange}
                            isLoading={loading.guests}
                        />
                    </div>
                </div>
            </div> 
            
            
            {selectedVisitor && (
                <div className={styles.sidebarBackdrop} onClick={() => setSelectedVisitor(null)}></div>
            )}
            {selectedVisitor && (
                <ActivitySidebar 
                    visitor={selectedVisitor} 
                    onClose={() => setSelectedVisitor(null)}
                    token={token} 
                />
            )}
        </div>
    );
}
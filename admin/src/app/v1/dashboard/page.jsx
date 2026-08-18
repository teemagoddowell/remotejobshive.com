'use client';
import { fetchAdminStats } from '@/constants';
import styles from '@/styles/adminDashboard.module.css';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
        const getStats = async () => {
          const token = localStorage.getItem('token');
          if (!token) {
              setError("Authentication required.");
              setLoading(false);
              return;
          }

            try {
                setLoading(true);
                const response = await fetch(fetchAdminStats, {
                    headers: { 'Authorization': `Bearer ${token}` }});

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch stats');
                }

                const data = await response.json();
                setStats(data);
                setError(null);

            } catch (err) {
                setError(err.message);
                setStats(null);
            } finally {
                setLoading(false);
            }
        };

        getStats();
    }, []);


  const recentActivity = [
    { id: 1, action: 'User registered', detail: 'test@example.com', time: '10m ago' },
    { id: 2, action: 'Job posted', detail: 'Senior Developer @ ACME', time: '1h ago' },
    { id: 3, action: 'Subscription cancelled', detail: 'user@sample.net', time: '3h ago' },
  ];

  if (loading) {
        return (
            <div className={styles.dashboardContainer}>
                <header className={styles.pageHeader}>
                    <h1>Admin Dashboard</h1>
                    <p>Loading overview...</p>
                </header>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.dashboardContainer}>
                <header className={styles.pageHeader}>
                    <h1>Admin Dashboard</h1>
                </header>
                <p className={styles.errorMessage}>Error loading dashboard: {error}</p>
            </div>
        );
    }

    const statsDisplay = stats ? [
        { label: 'Total Users', value: stats.totalUsers?.toLocaleString() || '0' },
        { label: 'Job Seekers', value: stats.jobSeekers?.toLocaleString() || '0' },
        { label: 'Recruiters', value: stats.recruiters?.toLocaleString() || '0' },
        { label: 'Active Jobs', value: stats.activeJobs?.toLocaleString() || '0' },
        { label: 'Active Subscriptions', value: stats.activeSubscriptions?.toLocaleString() || '0' },
    ] : [];

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.pageHeader}>
        <h1>Admin Dashboard</h1>
        <p>Overview of Remote JobsHive activity.</p>
      </header>

      <div className={styles.statsGrid}>
        {statsDisplay.map((stat, index) => (
          <div key={index} className={styles.statCard}>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.activitySection}>
        <h2>Recent Activity</h2>
        <ul className={styles.activityList}>
          {recentActivity.map((item) => (
            <li key={item.id} className={styles.activityItem}>
              <span className={styles.activityAction}>{item.action}:</span>
              <span className={styles.activityDetail}>{item.detail}</span>
              <span className={styles.activityTime}>{item.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
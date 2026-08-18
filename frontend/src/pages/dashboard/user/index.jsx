import React, { useContext, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import UserDashboardLayout from '@/components/layouts/UserDashboard';
import { AppName, fetchUserStats, LockIcon, fetchResume } from '@/constants';
import { AuthContext } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import styles from '@/styles/userDashboard.module.css'

const UserHomePageContent = ({ user, stats }) => {
    const formatExpiryDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const statsData = [
        { value: stats.isSubscribed ? stats.jobsApplied : <LockIcon />, label: 'Jobs Applied' },
        { value: stats.isSubscribed ? stats.savedJobs : <LockIcon />, label: 'Saved Jobs' },
        { 
            value: stats.isSubscribed ? 'PRO+' : 'Free Plan', 
            label: stats.isSubscribed ? `Expires ${formatExpiryDate(stats.expiryDate)}` : 'Upgrade to PRO' 
        },
    ];

    return (
        <>
            <Head>
                <title>{`Dashboard - ${AppName}`}</title>
            </Head>
            <div className={styles['saved-jobs-container']}>
                <h1 className={styles['dashboard-greeting']}>Welcome back, {user?.fullName}!</h1>
                <p className={styles['dashboard-subtext']}>Here's your job search summary.</p>
                <div className={styles['stats-grid']}>
                    {statsData.map((stat, index) => (
                        <div key={index} className={`${styles['dashboard-card']} ${styles['stat-card']}`}>
                            <div className={styles['stat-value']}>{stat.value}</div>
                            <div className={styles['stat-label']}>{stat.label}</div>
                        </div>
                    ))}
                </div>
                <div className={styles['dashboard-card']}>
                    <h2>Recent Applications</h2>
                    <ul className={styles['application-list']}>
                        {stats.isSubscribed && stats.recentApplications?.length > 0 ? (
                            stats.recentApplications.map((app, index) => (
                                <li key={index} className={styles['application-item']}>
                                    <div className={`${styles['application-details']} ${styles['user-details']}`}>
                                        <span className={styles['job-title']}>{app.title}</span>
                                        <span className={styles['company-name']}>{app.company_name}</span>
                                    </div>
                                    <span className={styles['status-badge']}>{app.application_status}</span>
                                </li>
                            ))
                        ) : (
                            <li><p className={styles['no-data-text']}>{stats.isSubscribed ? "You have no recent applications." : "Upgrade to PRO to track your applications."}</p></li>
                        )}
                    </ul>
                </div>
            </div>
        </>
    );
};

const FullDashboardPage = ({ user, stats: initialStats }) => {
    const { logout } = useContext(AuthContext);
    const router = useRouter();
    const [stats, setStats] = useState(initialStats);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const fetchStats = async () => {
        if (!token) return;
        try {
            const response = await fetch(fetchUserStats, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error("Failed to re-fetch dashboard stats:", error);
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const handleResumeUpload = async (file) => {
        if (!file) return;
        const toastId = toast.loading(`Uploading: ${file.name}...`);
        const formData = new FormData();
        formData.append('resume', file);

        try {
            const response = await fetch(fetchResume, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            toast.success(result.message, { id: toastId });
            fetchStats(); 
        } catch (error) {
            toast.error(`Upload failed: ${error.message}`, { id: toastId });
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) handleResumeUpload(file);
    };

    return (
        <UserDashboardLayout 
            user={user} 
            stats={stats}
            onLogout={handleLogout}
            onFileSelect={handleFileSelect}
        >
            <UserHomePageContent user={user} stats={stats} />
        </UserDashboardLayout>
    );
};


export async function getServerSideProps(context) {
    try {
        const { req } = context;
        const cookies = parse(req.headers.cookie || '');
        const token = cookies.token;

        if (!token) {
            return { redirect: { destination: '/login', permanent: false } };
        }
        
        const decodedUser = jwt.verify(token, process.env.JWT_SECRET);
        if (decodedUser.role !== 'user') {
            return { redirect: { destination: '/', permanent: false } };
        }

        const [userRes, statsRes] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/status`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(fetchUserStats, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (!userRes.ok || !statsRes.ok) throw new Error('Failed to fetch dashboard data');
        
        const user = await userRes.json();
        const stats = await statsRes.json();

        return {
            props: {
                user,
                stats,
            },
        };
    } catch (error) {
        console.error("Dashboard SSR Error:", error);
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: '/login', permanent: false } };
    }
}

export default FullDashboardPage;
import React, { useState } from 'react';
import Head from 'next/head';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import UserDashboardLayout from '@/components/layouts/UserDashboard';
import { CalendarIcon, fetchMyApplications, LocationIcon, AppName, fetchUserStats, fetchUserStatus } from '@/constants';
import styles from '@/styles/myapplication.module.css'; 


const ApplicationCard = ({ application }) => (
    <div className={styles['application-card']}>
        <div className={styles['job-info']}>
            <div className={styles['company-logo-app']}>
                <img src={application.company_logo || 'https://placehold.co/50x50/3B4A5C/FFF?text=JH'} alt={`${application.company_name} Logo`} />
            </div>
            <div className={styles['job-details-app']}>
                <h3>{application.title}</h3>
                <p>
                    <span>{application.company_name}</span>
                    <span className={styles['detail-divider']}>|</span>
                    <span><LocationIcon /> {application.job_location}</span>
                    <span className={styles['detail-divider']}>|</span>
                    <span><CalendarIcon /> Tracked on {new Date(application.application_date).toLocaleDateString()}</span>
                </p>
            </div>
        </div>
        <div className={styles['card-status']}>
            <div className={`${styles['status-select']} ${styles['status']}`}>
                {application.application_status}
            </div>
        </div>
    </div>
);

const MyApplicationsPage = ({ user, stats, initialApplications }) => {
    const [applications, setApplications] = useState(initialApplications);

    return (
        <>
            <Head>
                <title>{`My Applications - ${AppName}`}</title>
            </Head>
            <div className={styles['applications-container']}>
                <header className={styles['page-header']}>
                    <h1>Application Tracker</h1>
                    <p>Track the status of all your job applications in one place.</p>
                </header>
                <div className={styles['applications-list']}>
                    {applications.length > 0 ? (
                        applications.map(app => <ApplicationCard key={app.application_id} application={app} />)
                    ) : (
                        <div className={styles['dashboard-card']}><p>You haven't tracked any applications yet.</p></div>
                    )}
                </div>
            </div>
        </>
    );
};


MyApplicationsPage.getLayout = function getLayout(page) {
    const { user, stats } = page.props;
    return (
        <UserDashboardLayout user={user} stats={stats}>
            {page}
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

        
        const [userRes, statsRes, applicationsRes] = await Promise.all([
            fetch(fetchUserStatus, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(fetchUserStats, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(fetchMyApplications, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (!userRes.ok || !statsRes.ok || !applicationsRes.ok) throw new Error('Failed to fetch dashboard data');
        
        const user = await userRes.json();
        const stats = await statsRes.json();
        const initialApplications = await applicationsRes.json();

        if (!stats.isSubscribed) {
            return { redirect: { destination: '/dashboard/user/subscription', permanent: false } };
        }

        return {
            props: {
                user,
                stats,
                initialApplications,
            },
        };
    } catch (error) {
        console.error("My Applications SSR Error:", error);
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: '/login', permanent: false } };
    }
}

export default MyApplicationsPage;
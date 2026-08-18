import React, { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import toast from 'react-hot-toast';
import UserDashboardLayout from '@/components/layouts/UserDashboard';
import { TrashIcon, LocationIcon, ClockIcon, fetchSavedJobs, AppName, fetchUserStats, fetchUserStatus } from '@/constants';
import styles from '@/styles/savedJobs.module.css';


const SavedJobCard = ({ job, onUnsave }) => (
    <div className={styles['saved-job-card']}>
        <div className={styles['job-info']}>
            <div className={styles['company-logo-saved']}>
                <img src={job.company_logo || 'https://placehold.co/50x50/3B4A5C/FFF?text=JH'} alt={`${job.company_name} Logo`} />
            </div>
            <div className={styles['job-details-saved']}>
                <h3>{job.title}</h3>
                <p>
                    <span>{job.company_name}</span>
                    <span className={styles['detail-divider']}>|</span>
                    <span><LocationIcon /> {job.job_location}</span>
                    <span className={styles['detail-divider']}>|</span>
                    <span><ClockIcon /> {job.job_type}</span>
                </p>
            </div>
        </div>
        <div className={styles['card-actions']}>
            <button className={styles['unsave-btn']} onClick={() => onUnsave(job.id)}>
                <TrashIcon /> Unsave
            </button>
            <Link href={`/job/${job.slug}`} className={styles['view-job-btn']}>View Job</Link>
        </div>
    </div>
);

const SavedJobsPage = ({ user, stats, initialSavedJobs }) => {
    const [savedJobs, setSavedJobs] = useState(initialSavedJobs);

    const handleUnsave = async (jobId) => {
        const token = localStorage.getItem('token');
        setSavedJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
        toast.error('Job removed from saved list.');

        try {
            const response = await fetch(`${fetchSavedJobs}/${jobId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                console.error("Failed to unsave job on the server.");
            }
        } catch (error) {
            console.error("Error unsaving job:", error);
        }
    };

    return (
        <>
            <Head>
                <title>{`Saved Jobs - ${AppName}`}</title>
            </Head>
            <div className={styles['saved-jobs-container']}>
                <header className={styles['page-header']}>
                    <h1>Saved Jobs</h1>
                    <p>Review your saved jobs or remove ones you're no longer interested in.</p>
                </header>
                <div className={styles['saved-jobs-list']}>
                    {savedJobs.length > 0 ? (
                        savedJobs.map(job => <SavedJobCard key={job.id} job={job} onUnsave={handleUnsave} />)
                    ) : (
                        <div className={styles['dashboard-card']}><p>You haven't saved any jobs yet.</p></div>
                    )}
                </div>
            </div>
        </>
    );
};

SavedJobsPage.getLayout = function getLayout(page) {
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
        
        const user = jwt.verify(token, process.env.JWT_SECRET);
        if (user.role !== 'user') {
            return { redirect: { destination: '/', permanent: false } };
        }

        const [userRes, statsRes, savedJobsRes] = await Promise.all([
            fetch(fetchUserStatus, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(fetchUserStats, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(fetchSavedJobs, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (!savedJobsRes.ok || !statsRes.ok) throw new Error('Failed to fetch dashboard data');
        
        
        const fullUserObject = await userRes.json();
        const stats = await statsRes.json();
        const initialSavedJobs = await savedJobsRes.json();


        
        if (!stats.isSubscribed) {
            return { redirect: { destination: '/dashboard/user/subscription', permanent: false } };
        }

        
        return {
            props: {
                user: fullUserObject,
                stats,
                initialSavedJobs,
            },
        };
    } catch (error) {
        console.error("Saved Jobs SSR Error:", error);
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: '/login', permanent: false } };
    }
}

export default SavedJobsPage;
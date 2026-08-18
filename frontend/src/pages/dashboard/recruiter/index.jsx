import React from 'react';
import Head from 'next/head';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import RecruiterDashboardLayout from '@/components/layouts/RecruiterDashboard';
import { AppName, fetchMyDashboardStats } from '@/constants';
import styles from '@/styles/recruiterDashboard.module.css';

const RecruiterHomePage = ({ stats }) => {
    if (!stats) return <p>Could not load dashboard data.</p>;

    const statsData = [
        { value: stats.stats?.active_jobs_count || 0, label: 'Active Jobs' },
        { value: stats.stats?.total_applicants_count || 0, label: 'Total Applicants' },
        { value: stats.stats?.new_applicants_this_week || 0, label: 'New This Week' },
    ];

    return (
        <>
            <Head>
                <title>{`Recruiter Dashboard - ${AppName}`}</title>
            </Head>
            <div className={styles['new-posting-container']}>
                <h1 className={styles['dashboard-greeting']}>Recruiter Dashboard</h1>
                <p className={styles['dashboard-subtext']}>Manage your job postings and applicants.</p>
                <div className={styles['stats-grid']}>
                    {statsData.map((stat, index) => (
                        <div key={index} className={`${styles['dashboard-card']} ${styles['stat-card']}`}>
                            <div className={styles['stat-value']}>{stat.value}</div>
                            <div className={styles['stat-label']}>{stat.label}</div>
                        </div>
                    ))}
                </div>
                <div className={styles['dashboard-grid']}>
                    <div className={styles['dashboard-card']}>
                        <h2>Active Job Postings</h2>
                        <ul className={styles['data-list']}>
                            {stats.activeJobs?.map((job, index) => (
                                <li key={index} className={styles['data-item']}>
                                    <div className={styles['data-details']}>
                                        <span className={styles['item-title']}>{job.title}</span>
                                        <span className={styles['item-subtitle']}>{job.applicants} Applicants</span>
                                    </div>
                                    <span className={`${styles['status-badge']} ${styles[`status-${job.status.toLowerCase()}`]}`}>{job.status}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className={styles['dashboard-card']}>
                        <h2>Recent Applicants</h2>
                        <ul className={styles['data-list']}>
                            {stats.recentApplicants?.map((applicant, index) => (
                                <li key={index} className={styles['data-item']}>
                                    <div className={`${styles['data-details']} ${styles['applicant-details']} ${styles['recruiter-details']}`}>
                                        <img src={applicant.avatar || '/images/avatars/default.png'} alt="Applicant Avatar" className={styles['applicant-avatar']} />
                                        <div>
                                            <span className={styles['item-title']}>{applicant.name}</span>
                                            <span className={styles['item-subtitle']}>Applied for {applicant.applyingfor}</span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
};

RecruiterHomePage.getLayout = function getLayout(page) {
    return (
        <RecruiterDashboardLayout>
            {page}
        </RecruiterDashboardLayout>
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
        if (decodedUser.role !== 'recruiter' && decodedUser.role !== 'admin') {
            return { redirect: { destination: '/', permanent: false } };
        }

        // Fetch the recruiter stats on the server
        const statsRes = await fetch(fetchMyDashboardStats, { headers: { 'Authorization': `Bearer ${token}` } });
        
        if (!statsRes.ok) throw new Error('Failed to fetch recruiter dashboard stats');
        
        const stats = await statsRes.json();

        return {
            props: {
                stats,
            },
        };
    } catch (error) {
        console.error("Recruiter Dashboard SSR Error:", error);
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: '/login', permanent: false } };
    }
}

export default RecruiterHomePage;
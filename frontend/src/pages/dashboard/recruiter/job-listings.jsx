import React, { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import RecruiterDashboardLayout from '@/components/layouts/RecruiterDashboard';
import { AppName, fetchAllJobs, fetchJobs, fetchMyDashboardStats } from '@/constants';
import styles from '@/styles/myjoblisting.module.css';

const MyJobPostingsPage = ({ initialJobs, stats }) => {
    const [jobs, setJobs] = useState(initialJobs);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const handleDelete = async (jobId) => {
        if (window.confirm("Are you sure you want to delete this job posting?")) {
            const toastId = toast.loading('Deleting job...');
            try {
                const response = await fetch(`${fetchJobs}/${jobId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to delete job.');
                
                setJobs(jobs.filter(job => job.id !== jobId));
                toast.success('Job deleted successfully.', { id: toastId });
            } catch (error) {
                toast.error(`Error: ${error.message}`, { id: toastId });
            }
        }
    };

    const getStatusClass = (status) => {
        if (!status) return '';
        return `status-${status.toLowerCase()}`;
    };

    return (
        <>
            <Head>
                <title>{`My Job Listings - ${AppName}`}</title>
            </Head>
            <div className={styles['my-postings-container']}>
                <header className={styles['page-header']}>
                    <h1>My Job Listings</h1>
                    <p>Manage your active job listings.</p>
                    <Link href="/dashboard/recruiter/new-listing" className="btn btn-primary">
                        Post a New Job
                    </Link>
                </header>

                <div className={styles['job-listings-table']}>
                    <table className={styles['myTable']}>
                        <thead className={styles.thead}>
                            <tr className={styles.tr}>
                                <th className={styles.th}>Job Title</th>
                                <th className={styles.th}>Status</th>
                                <th className={styles.th}>Date Posted</th>
                                <th className={styles.th}>Applicants</th>
                                <th className={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.length > 0 ? (
                                jobs.map(job => (
                                    <tr key={job.id}>
                                        <td className={styles.td}>
                                            <Link href={`/job/${job.slug}`}>{job.title}</Link>
                                        </td>
                                        <td className={styles.td}>
                                            <span className={`${styles['status-badge']} ${styles[getStatusClass(job.status)]}`}>{job.status}</span>
                                        </td>
                                        <td className={styles.td}>{formatDistanceToNow(new Date(job.date_posted), { addSuffix: true })}</td>
                                        <td className={styles.td}>{job.applicant_count}</td>
                                        <td className={styles['action-buttons']}>
                                            <Link 
                                                href={{ pathname: '/dashboard/recruiter/new-listing', query: { edit: job.id } }}
                                                className={`${styles['btn-action']} ${styles['btn-edit']}`}
                                            >
                                                Edit
                                            </Link>
                                            <button className={`${styles['btn-action']} ${styles['btn-delete']}`} onClick={() => handleDelete(job.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className={styles['td']}>You have not posted any jobs yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

// This tells Next.js to wrap our page with the RecruiterDashboardLayout.
MyJobPostingsPage.getLayout = function getLayout(page) {
    // The layout gets the user from AuthContext, and stats are not needed for the layout.
    return (
        <RecruiterDashboardLayout>
            {page}
        </RecruiterDashboardLayout>
    );
};

// This function runs on the server to protect the route and fetch the recruiter's jobs.
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

        const jobsRes = await fetch(fetchAllJobs, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!jobsRes.ok) throw new Error('Failed to fetch job postings');
        
        const initialJobs = await jobsRes.json();

        return {
            props: {
                initialJobs,
            },
        };
    } catch (error) {
        console.error("My Job Postings SSR Error:", error);
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: '/login', permanent: false } };
    }
}

export default MyJobPostingsPage;
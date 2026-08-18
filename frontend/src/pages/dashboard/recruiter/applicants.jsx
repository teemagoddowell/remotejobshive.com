import React, { useState } from 'react';
import Head from 'next/head';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import RecruiterDashboardLayout from '@/components/layouts/RecruiterDashboard';
import { AppName, fetchMyApplicants, fetchResumeDownload, fetchViewDownload } from '@/constants';
import styles from '@/styles/applicants.module.css';

const RecruiterApplicantsPage = ({ initialApplicants }) => {
    const [applicantsByJob, setApplicantsByJob] = useState(initialApplicants);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    return (
        <>
            <Head>
                <title>{`Applicants - ${AppName}`}</title>
            </Head>
            <div className={styles['applicants-container']}>
                <header className={styles['page-header']}>
                    <h1>Applicants</h1>
                    <p>View and manage candidates who have applied to your job postings.</p>
                </header>

                {Object.keys(applicantsByJob).length > 0 ? (
                    Object.entries(applicantsByJob).map(([jobTitle, applicants]) => (
                        <div key={jobTitle} className={styles['job-group-card']}>
                            <h2 className={styles['job-group-title']}>{jobTitle} ({applicants.length} Applicants)</h2>
                            <ul className={styles['applicant-list']}>
                                {applicants.map(applicant => (
                                    <li key={applicant.application_id} className={styles['applicant-item']}>
                                        <div className={styles['applicant-info']}>
                                            <img src={applicant.applicant_avatar || '/images/avatars/default.png'} alt="Applicant Avatar" className={styles['applicant-avatar']} />
                                            <div className={`${styles['applicant-details']} ${styles.rdetails}`}>
                                                <span className={styles['applicant-name']}>{applicant.applicant_name}</span>
                                                <span className={styles['applicant-title']}>{applicant.applicant_title}</span>
                                            </div>
                                        </div>
                                        <div className={styles['applicant-actions']}>
                                            {applicant.resume_url ? (
                                                <>
                                                    <a 
                                                        href={`${fetchViewDownload}?path=${encodeURIComponent(applicant.resume_url)}&token=${token}`}
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="btn btn-secondary"
                                                    >
                                                        Open Resume
                                                    </a>
                                                    <a 
                                                        href={`${fetchResumeDownload}?path=${encodeURIComponent(applicant.resume_url)}&filename=${encodeURIComponent(applicant.resume_filename)}&token=${token}`}
                                                        className="btn btn-primary"
                                                    >
                                                        Download Resume
                                                    </a>
                                                </>
                                            ) : (
                                                <span className={styles['no-resume']}>No Resume</span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                ) : (
                    <div className={styles['job-group-card']}><p>No applicants yet for any of your job postings.</p></div>
                )}
            </div>
        </>
    );
};

RecruiterApplicantsPage.getLayout = function getLayout(page) {
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

        const applicantsRes = await fetch(fetchMyApplicants, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!applicantsRes.ok) throw new Error('Failed to fetch applicants');
        
        const data = await applicantsRes.json();
        
        const initialApplicants = data.reduce((acc, applicant) => {
            (acc[applicant.job_title] = acc[applicant.job_title] || []).push(applicant);
            return acc;
        }, {});

        return {
            props: {
                initialApplicants,
            },
        };
    } catch (error) {
        console.error("Applicants SSR Error:", error);
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: '/login', permanent: false } };
    }
}

export default RecruiterApplicantsPage;
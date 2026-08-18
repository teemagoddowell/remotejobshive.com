import React, { useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { AuthContext } from '@/context/AuthContext';
import { DashboardIcon, PostingsIcon, LogoutIcon, ApplicantsIcon, SettingsIcon } from '@/constants';
import styles from '@/styles/recruiterDashboard.module.css'; 

const RecruiterDashboardLayout = ({ children }) => {
    const { user, logout } = useContext(AuthContext);
    const router = useRouter();

    return (
        <>
            <Header />
            <div className={styles['dashboard-body']}>
                <div className={styles['dashboard-container']}>
                    <aside className={styles['dashboard-sidebar']}>
                        <div className={styles['profile-summary']}>
                            <img src={user?.avatar || "/images/default.png"} alt="Company Logo" className={styles['profile-avatar']} />
                            <h3>{user?.fullName}</h3>
                            <p>Recruiter Account</p>
                        </div>
                        <nav className={styles['dashboard-nav']}>
                            <Link href="/dashboard/recruiter" className={`${styles['nav-link']} ${router.pathname === '/dashboard/recruiter' ? styles.active : ''}`}>
                                <DashboardIcon /> Dashboard
                            </Link>
                            <Link href="/dashboard/recruiter/job-listings" className={`${styles['nav-link']} ${router.pathname.includes('job-listings') ? styles.active : ''}`}>
                                <PostingsIcon /> My Job Postings
                            </Link>
                            <Link href="/dashboard/recruiter/applicants" className={`${styles['nav-link']} ${router.pathname.includes('applicants') ? styles.active : ''}`}>
                                <ApplicantsIcon /> Applicants
                            </Link>
                            <Link href="/dashboard/recruiter/settings" className={`${styles['nav-link']} ${router.pathname.includes('settings') ? styles.active : ''}`}>
                                <SettingsIcon /> Settings
                            </Link>
                            <a href="/logout" className={`${styles['nav-link']} ${styles['logout-link']}`}><LogoutIcon /> Logout</a>
                        </nav>
                        <Link href={user?.isSubscribed ? "/dashboard/recruiter/new-listing" : "/dashboard/recruiter/subscription"} className={styles['btn-primary-full']}>
                            Post a New Job
                        </Link>
                    </aside>
                    <main className={styles['dashboard-main-content']}>
                        {children}
                    </main>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default RecruiterDashboardLayout;
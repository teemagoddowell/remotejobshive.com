import React, { useContext, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { ProfileIcon, LogoutIcon, ApplicationsIcon, SavedJobsIcon, SubscriptionIcon, SettingsIcon } from '@/constants';
import styles from '@/styles/userDashboard.module.css'; 
import { AuthContext } from '@/context/AuthContext';

const UserDashboardLayout = ({ user, stats, children, onFileSelect }) => {
    const router = useRouter();
    const fileInputRef = useRef(null);
    const { logout } = useContext(AuthContext);

    return (
        <>
            <Header />
            <div className={styles['dashboard-body']}>
                <div className={styles['dashboard-container']}>
                    <aside className={styles['dashboard-sidebar']}>
                        <div className={styles['profile-summary']}>
                            <img src={user?.avatar || '/images/default.png'} alt="User Avatar" className={styles['profile-avatar']} />
                            <h3>{user?.fullName}</h3>
                            <p>{user?.title}</p>
                        </div>
                        <nav className={styles['dashboard-nav']}>
                            <Link href="/dashboard/user" className={`${styles['nav-link']} ${router.pathname === '/dashboard/user' ? styles.active : ''}`}>
                                <ProfileIcon /> Dashboard
                            </Link>
                            <Link href="/dashboard/user/saved-jobs" className={`${styles['nav-link']} ${router.pathname.includes('saved-jobs') ? styles.active : ''}`}>
                                <SavedJobsIcon /> Saved Jobs
                            </Link>
                            <Link href="/dashboard/user/applications" className={`${styles['nav-link']} ${router.pathname.includes('applications') ? styles.active : ''}`}>
                                <ApplicationsIcon /> My Applications
                            </Link>
                            <Link href="/dashboard/user/subscription" className={`${styles['nav-link']} ${router.pathname.includes('subscription') ? styles.active : ''}`}>
                                <SubscriptionIcon /> Manage Subscription
                            </Link>
                            <Link href="/dashboard/user/settings" className={`${styles['nav-link']} ${router.pathname.includes('settings') ? styles.active : ''}`}>
                                <SettingsIcon /> Settings
                            </Link>
                            <a onClick={logout} className={`${styles['nav-link']} ${styles['logout-link']}`}><LogoutIcon /> Logout</a>
                        </nav>
                        <div className={styles['resume-uploader']}>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={onFileSelect} 
                                style={{ display: 'none' }}
                                accept=".pdf,.doc,.docx"
                            />
                            <button 
                                className={styles['btn-primary-full']} 
                                onClick={() => fileInputRef.current.click()}
                            >
                                {stats?.resumeFilename ? stats.resumeFilename : 'Upload Your Resume'}
                            </button>
                        </div>
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

export default UserDashboardLayout;
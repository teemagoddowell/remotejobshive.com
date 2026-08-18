'use client';
import React, { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from '@/styles/adminLayout.module.css';
import { CompaniesIcon, DashboardIcon, JobsIcon, logoURL, LogoutIcon, UsersIcon, AnalyticsIcon, HamburgerIcon,  ChevronLeftIcon } from '@/constants';
import { AuthContext } from '@/context/AuthContext';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { user, loading, logout } = useContext(AuthContext);
  const pathname = usePathname();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { href: '/v1/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { href: '/v1/users', label: 'Users', icon: UsersIcon },
    { href: '/v1/jobs', label: 'Jobs', icon: JobsIcon },
    { href: '/v1/companies', label: 'Companies', icon: CompaniesIcon },
    { href: '/v1/analytics', label: 'Analytics', icon: AnalyticsIcon },
  ];

  useEffect(() => {
    if (!loading) {
      const token = localStorage.getItem('token');
      if (!token || !user || user.role !== 'admin') {
        router.push('/');
      } else {
        setIsCheckingAuth(false);
      }
    }
  }, [loading, user, router]);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  const handleLogout = () => { logout(); };

  if (loading || isCheckingAuth) {
    return (
      <div className={styles.loadingScreen}>
        <p>Verifying access...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      {isMobileNavOpen && (
        <div className={styles.overlay} onClick={() => setIsMobileNavOpen(false)}></div>
      )}

      <aside className={`${styles.sidebar} ${isMobileNavOpen ? styles.sidebarOpen : ''} ${isCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/v1/dashboard" className={styles.logoLink}>
              <img src={logoURL} alt="Logo" className={styles.sidebarLogo} />
              <p className={styles.sidebarTitle}>Admin Panel</p>
          </Link>
          <button className={styles.collapseButton} onClick={() => setIsCollapsed(!isCollapsed)} aria-label="Toggle sidebar">
            <ChevronLeftIcon />
          </button>
        </div>
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.href} className={styles.navItem} title={isCollapsed ? item.label : ''}>
                  <Link href={item.href} className={`${styles.navLink} ${isActive ? styles.active : ''}`}>
                    <item.icon className={styles.navIcon} />
                    <span className={styles.linkLabel}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <button onClick={handleLogout} className={`${styles.navLink} ${styles.logoutLink}`} title={isCollapsed ? 'Logout' : ''}>
          <LogoutIcon className={styles.navIcon} />
          <span className={styles.linkLabel}>Logout</span>
        </button>
      </aside>

      <div className={styles.contentWrapper}>
        <header className={styles.mobileHeader}>
          <button className={styles.hamburgerButton} onClick={() => setIsMobileNavOpen(true)} aria-label="Open navigation menu">
            <HamburgerIcon />
          </button>
          <span className={styles.mobileTitle}>Admin Panel</span>
        </header>
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
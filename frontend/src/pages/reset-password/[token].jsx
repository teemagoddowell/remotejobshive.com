import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { AppName, fetchResetPassword, logoURL} from '@/constants';
import styles from '@/styles/login.module.css';

const ResetPasswordPage = () => {
    const router = useRouter();
    const { token } = router.query; 
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!router.isReady) return;
        if (!token) {
            toast.error("Invalid or missing reset token.");
            router.push('/forgot-password');
        }
    }, [router.isReady, token, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return toast.error("Passwords do not match.");
        }
        if (password.length < 5) {
            return toast.error("New password is too short (minimum 5 characters).");
        }
        setLoading(true);
        const toastId = toast.loading('Resetting password...');

        try {
            const response = await fetch(fetchResetPassword, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            toast.success(data.message, { id: toastId });
            router.push('/login'); 
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>{`Reset Password | ${AppName}`}</title>
            </Head>
            <div className={styles['login-page']}>
                <div className={styles['login-form-section']}>
                    <header className={styles['login-header']}>
                        <a href="/" className={styles['headerLogo']}>
                            <img src={logoURL} width="300px" alt="JobsHive Logo" />
                        </a>
                    </header>
                    <main className={styles['form-container']}>
                        <h2>Set a New Password</h2>
                        <form onSubmit={handleSubmit}>
                            <div className={styles['form-group']}>
                                <label htmlFor="password">New Password</label>
                                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <div className={styles['form-group']}>
                                <label htmlFor="confirm-password">Confirm New Password</label>
                                <input type="password" id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                            </div>
                            <button type="submit" className={styles['login-btn']} disabled={loading}>
                                {loading ? 'Saving...' : 'Reset Password'}
                            </button>
                        </form>
                    </main>
                </div>
            </div>
        </>
    );
};

export default ResetPasswordPage;
import React, { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head'; 
import toast from 'react-hot-toast';
import { AppName, fetchForgotPassword, forgotPassword, logoURL } from '../constants';
import styles from '@/styles/login.module.css';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (cooldown > 0) return;

        setLoading(true);
        const toastId = toast.loading('Sending reset link...');

        try {
            const response = await fetch(fetchForgotPassword, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            if (response.status === 201) {
                toast.error(data.message, { id: toastId, duration: 6000 });
            } else {
                toast.success(data.message, { id: toastId, duration: 6000 });
            }


            setCooldown(90);
            const interval = setInterval(() => {
                setCooldown(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>{`Forgot Password | ${AppName}`}</title>
            </Head>
            <div className={styles['login-page']}>
                <div className={styles['login-form-section']}>
                    <header className={styles['login-header']}>
                        <a href="/" className={styles['headerLogo']}>
                            <img src={logoURL} width="300px" alt="JobsHive Logo" />
                        </a>
                    </header>
                    <main className={styles['form-container']}>
                        <h2>Forgot Your Password?</h2>
                        <p className={styles['signup-link']}>Enter your email and we'll send you a link to reset it.</p>
                        <form onSubmit={handleSubmit}>
                            <div className={`form-group ${styles['form-group']}`}>
                                <label htmlFor="email">E-mail</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className={styles['login-btn']}
                                disabled={loading || cooldown > 0}
                            >
                                {loading ? 'Sending...' : cooldown > 0 ? `Try again in ${cooldown}s` : 'Send Reset Link'}
                            </button>
                            <div className='text-center mt-3'>
                                <Link href="/login" className={styles['forgot-password']}>Back to Login</Link>
                            </div>
                        </form>
                    </main>
                </div>
            </div>
        </>
    );
};

export default ForgotPasswordPage;

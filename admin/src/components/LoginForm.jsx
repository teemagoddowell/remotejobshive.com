// src/components/admin/LoginForm.jsx
'use client';

import React, { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from '@/styles/adminLogin.module.css';
import { AuthContext } from '@/context/AuthContext';
import { fetchAdminLogin } from '@/constants';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const toastId = toast.loading('Logging in...');

    try {
      const response = await fetch(fetchAdminLogin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Login failed (Status: ${response.status})`);
      }

      if (data.user?.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }

      // Login successful
      login(data.user, data.token);
      toast.success('Login successful!', { id: toastId });
      router.push('/v1/dashboard');

    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'An error occurred.', { id: toastId });
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <img src="/logo.png" alt="Remote JobsHive Logo" className={styles.logo} />
        <h2>Admin Panel Login</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          {error && <p className={styles.errorMessage}>{error}</p>}
          <button type="submit" className={styles.loginButton} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
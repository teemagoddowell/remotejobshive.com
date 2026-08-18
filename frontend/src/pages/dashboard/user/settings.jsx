import React, { useState, useContext } from 'react';
import Head from 'next/head';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import toast from 'react-hot-toast';
import UserDashboardLayout from '@/components/layouts/UserDashboard';
import { AuthContext } from '@/context/AuthContext';
import { AppName, fetchChangePassword, fetchUserAvatar, fetchUserMe, fetchUserProfile, fetchUserStats } from '@/constants';
import styles from '@/styles/settings.module.css';
import { useRouter } from 'next/router';

const UserSettingsPage = ({ user, stats }) => {
    const { login } = useContext(AuthContext);
    const router = useRouter();
    
    const [profileData, setProfileData] = useState({ 
        fullName: user?.fullName || '', 
        title: user?.title || '',
        email: user?.email || '' 
    });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });
    const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Updating profile...');
        try {
            const response = await fetch(fetchUserProfile, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ fullName: profileData.fullName, title: profileData.title })
            });
            if (!response.ok) throw new Error('Failed to update profile.');
            toast.success('Profile updated successfully!', { id: toastId });
            router.push("./settings");
        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return toast.error("New passwords do not match.");
        }
        if (passwordData.newPassword.length < 5) {
            return toast.error("New password is too short (minimum 5 characters).");
        }
        const toastId = toast.loading('Changing password...');
        try {
            const response = await fetch(fetchChangePassword, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            toast.success(result.message, { id: toastId });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) { 
            toast.error("File is too large! Please select an image smaller than 5MB.");
            e.target.value = null;
            return;
        }
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleAvatarSubmit = async (e) => {
        e.preventDefault();
        if (!avatarFile) return toast.error('Please select an image to upload.');
        const toastId = toast.loading("Uploading avatar...");
        const formData = new FormData();
        formData.append('avatar', avatarFile); 

        try {
            const response = await fetch(fetchUserAvatar, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            const updatedUser = { ...user, avatar: result.avatar_url };
            login(updatedUser, token);

            toast.success('Avatar updated successfully!', { id: toastId });
            setAvatarFile(null); 
            router.push("./settings");
        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    };

    return (
        <>
            <Head>
                <title>{`Settings - ${AppName}`}</title>
            </Head>
            <div className={styles['settings-container']}>
                <header className={styles['page-header']}>
                    <h1>Settings</h1>
                    <p>Manage your account and profile information.</p>
                </header>

                <div className={styles['settings-card']}>
                    <h2>Profile Picture</h2>
                    <form onSubmit={handleAvatarSubmit} className={styles['avatar-uploader']}>
                        <img 
                            src={avatarPreview || '/images/avatars/default.png'} 
                            alt="Avatar Preview" 
                            className={styles['avatar-preview']} 
                        />
                        <input 
                            type="file" 
                            id="avatar-upload" 
                            accept="image/png, image/jpeg"
                            onChange={handleAvatarChange} 
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="avatar-upload" className={`${styles.btn} btn btn-secondary`}>
                            Choose Image
                        </label>
                        {avatarFile && <button type="submit" className={`${styles.btn} btn btn-primary`}>Upload</button>}
                    </form>
                </div>

                <div className={styles['settings-card']}>
                    <h2>Profile Information</h2>
                    <form onSubmit={handleProfileSubmit}>
                        <div className={styles['form-group']}>
                            <label htmlFor="fullName">Full Name</label>
                            <input type="text" id="fullName" name="fullName" value={profileData.fullName || ''} onChange={handleProfileChange} />
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor="title">Professional Title</label>
                            <input type="text" id="title" name="title" value={profileData.title || ''} onChange={handleProfileChange} placeholder="e.g., Senior Software Engineer" />
                        </div>
                        <div className={styles['form-group']}>
                            <label>Email</label>
                            <input type="email" value={profileData.email || ''} disabled />
                        </div>
                        <div className={styles['form-actions']}>
                            <button type="submit" className={`${styles['btn']} btn btn-primary`}>Save Profile</button>
                        </div>
                    </form>
                </div>

                <div className={styles['settings-card']}>
                    <h2>Change Password</h2>
                    <form onSubmit={handlePasswordSubmit}>
                        <div className={styles['form-group']}>
                            <label htmlFor="currentPassword">Current Password</label>
                            <input type="password" id="currentPassword" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} />
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor="newPassword">New Password</label>
                            <input type="password" id="newPassword" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} />
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} />
                        </div>
                        <div className={styles['form-actions']}>
                            <button type="submit" className={`${styles['btn']} btn btn-primary`}>Change Password</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

UserSettingsPage.getLayout = function getLayout(page) {
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
        
        const decodedUser = jwt.verify(token, process.env.JWT_SECRET);
        if (decodedUser.role !== 'user') {
            return { redirect: { destination: '/', permanent: false } };
        }

        const [userRes, statsRes] = await Promise.all([
            fetch(fetchUserMe, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(fetchUserStats, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (!userRes.ok || !statsRes.ok) throw new Error('Failed to fetch dashboard data');
        
        const rawUser = await userRes.json();
        const stats = await statsRes.json();
        
        const user = {
            id: rawUser.id,
            fullName: rawUser.full_name,
            email: rawUser.email,
            avatar: rawUser.avatar_url,
            title: rawUser.title,
            role: decodedUser.role,
            isSubscribed: decodedUser.isSubscribed, 
        };

        return {
            props: {
                user,
                stats,
            },
        };
    } catch (error) {
        console.error("User Settings SSR Error:", error);
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: '/login', permanent: false } };
    }
}

export default UserSettingsPage;
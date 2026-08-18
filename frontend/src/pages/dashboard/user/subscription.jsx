import React, { useState, useContext } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import toast from 'react-hot-toast';
import UserDashboardLayout from '@/components/layouts/UserDashboard';
import SubscriptionPlan from '@/components/common/Subscriptions';
import { AuthContext } from '@/context/AuthContext';
import { AppName, fetchCancelSubscription, fetchManageSubscription, fetchUserStats, fetchUserStatus } from '@/constants';
import styles from '@/styles/manage-subscription.module.css';

const ManageSubscriptionPage = ({ user, stats, initialSubscription }) => {
    const { login } = useContext(AuthContext);
    const router = useRouter();
    const [subscription, setSubscription] = useState(initialSubscription);
    const [isChangingPlan, setIsChangingPlan] = useState(false);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const fetchSubscription = async () => {
        try {
            const response = await fetch(fetchManageSubscription, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setSubscription(data);
        } catch (error) {
            console.error("Failed to refetch subscription", error);
        }
    };

    const cancelSubscription = async () => {
        const toastId = toast.loading("Cancelling your subscription...");
        try {
            const response = await fetch(fetchCancelSubscription, {
                method: 'POST',
                headers: { 'Content-type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Unable to Cancel Subscription');

            login(data.user, data.token);
            toast.success("Your subscription has been cancelled.", { id: toastId });
            fetchSubscription(); 
        } catch (error){
            toast.error(`Error: ${error.message}`, { id: toastId });
        }
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const daysLeft = subscription ? 
        Math.round((new Date(subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24)) 
        : 0;
    const canChangePlan = daysLeft <= 5;

    return (
        <>
            <Head>
                <title>{`Manage Subscription - ${AppName}`}</title>
            </Head>
            <Script src="https://checkout.flutterwave.com/v3.js" strategy="lazyOnload" />
            
            <div className={styles['manage-subscription-container']}>
                {isChangingPlan ? (
                    <>
                        <header className={styles['page-header']}>
                            <h1>Choose a New Plan</h1>
                            <p>Select a new plan to upgrade or change your subscription.</p>
                            <button className={`${styles['btn']} ${styles['btn-secondary']} ${styles['back-btn']}`} onClick={() => setIsChangingPlan(false)}>
                                ← Back to Current Plan
                            </button>
                        </header>
                        <SubscriptionPlan current_plan={Number(subscription.plan_price)}/>
                    </>
                ) : (
                    <>
                        <header className={styles['page-header']}>
                            <h1>Manage Subscription</h1>
                            <p>View your current plan details and manage your subscription.</p>
                        </header>

                        {subscription ? (
                            <div className={styles['subscription-card']}>
                                <div className={styles['card-header']}>
                                    <h3>Your Current Plan</h3>
                                    <span className={styles['plan-name']}>{subscription.plan_name}</span>
                                </div>
                                <div className={styles['card-body']}>
                                    <div className={styles['detail-row']}>
                                        <span className={styles['detail-label']}>Status</span>
                                        {subscription.status === 'active' ? 
                                            <span className={`${styles['detail-value']} ${styles['status-active']}`}>{subscription.status}</span>
                                            : 
                                            <span className={`${styles['detail-value']} ${styles['status-inactive']}`}>{subscription.status}</span>
                                        }
                                    </div>
                                    <div className={styles['detail-row']}>
                                        <span className={styles['detail-label']}>Subscribed On</span>
                                        <span className={styles['detail-value']}>{formatDate(subscription.start_date)}</span>
                                    </div>
                                    <div className={styles['detail-row']}>
                                        <span className={styles['detail-label']}>{subscription.status === 'active' ? 'Next Renewal Date' : 'Expires On'}</span>
                                        <span className={styles['detail-value']}>{formatDate(subscription.end_date)}</span>
                                    </div>
                                    <div className={styles['detail-row']}>
                                        <span className={styles['detail-label']}>Price</span>
                                        <span className={styles['detail-value']}>${subscription.plan_price} / {subscription.period}</span>
                                    </div>
                                </div>
                                <div className={styles['card-footer']}>
                                    {subscription.status === 'active' && 
                                    <>
                                        <button 
                                            type="button" 
                                            onClick={() => setIsChangingPlan(true)} 
                                            className="btn btn-primary"
                                            disabled={!canChangePlan}
                                            title={!canChangePlan ? `You can change your plan when you have 5 days or less remaining.` : ''}
                                        >
                                            Choose Another Plan
                                        </button>
                                        <button type="button" onClick={cancelSubscription} className={`${styles['btn-danger']} btn btn-danger`}>Cancel Subscription</button>
                                    </>
                                    }
                                    {subscription.status === 'cancelled' && <p>You can choose a new plan again after your current cancelled plan expires.</p>}
                                </div>
                            </div>
                        ) : (
                            <div className={`${styles['subscription-card']} ${styles['no-plan']}`}>
                                <p>You do not have an active subscription. Upgrade to a PRO plan to unlock all features.</p>
                                <SubscriptionPlan />
                            </div>
                        )} 
                    </>
                )}
            </div>
        </>
    );
};

ManageSubscriptionPage.getLayout = function getLayout(page) {
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


        const [userRes, statsRes, subRes] = await Promise.all([
            fetch(fetchUserStatus, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(fetchUserStats, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(fetchManageSubscription, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (!userRes.ok || !statsRes.ok || !subRes.ok) throw new Error('Failed to fetch dashboard data');
        
        const user = await userRes.json();
        const stats = await statsRes.json();
        const initialSubscription = await subRes.json();

        return {
            props: {
                user,
                stats,
                initialSubscription,
            },
        };
    } catch (error) {
        console.error("Manage Subscription SSR Error:", error);
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: '/login', permanent: false } };
    }
}

export default ManageSubscriptionPage;
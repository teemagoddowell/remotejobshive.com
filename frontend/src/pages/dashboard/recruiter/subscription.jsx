import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import Head from 'next/head';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import RecruiterDashboardLayout from '@/components/layouts/RecruiterDashboard';
import { recruiterPlans, FLUTTERWAVE_PUBLIC_KEY, fetchPaymentVerify, recruiterDashboard, AppName } from '@/constants';
import { AuthContext } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const RecruiterSubscriptionPage = ({ user: serverUser }) => {
    const { user, login } = useContext(AuthContext);
    const router = useRouter();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const currentUser = user || serverUser;
    const proPlan = recruiterPlans[0];

    const handleVerification = async (transaction_id, fw_plan_id) => {
        try {
            const response = await fetch(fetchPaymentVerify, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ transaction_id, fw_plan_id })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Verification Failed');
            
            login(data.user, data.token);
            toast.success('Subscription activated successfully!');
            router.push(recruiterDashboard);
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        }
    };

    const handlePayment = (plan) => {
        if (!currentUser) { 
            router.push('/login'); 
            return; 
        }

        if (typeof window.FlutterwaveCheckout !== 'function') {
            toast.error("Payment service is loading. Please try again in a moment.");
            return;
        }

        window.FlutterwaveCheckout({
            public_key: FLUTTERWAVE_PUBLIC_KEY,
            tx_ref: `jobshive-recruiter-${currentUser.id}-${Date.now()}`,
            amount: plan.price,
            currency: 'USD',
            customer: { email: currentUser.email, name: currentUser.fullName },
            customizations: {
                title: "JobsHive Recruiter PRO",
                logo: 'https://www.remotejobshive.co/favicon.ico',
            },
            callback: (data) => {
                if (data.status === "successful") {
                    handleVerification(data.transaction_id, plan.fw_plan_id);
                    router.push("/dashboard/recruiter");
                } else {
                    toast.error("Payment was not successful.");
                }
            },
        });
    };

    return (
        <>
            <Head>
                <title>{`Recruiter Subscription - ${AppName}`}</title>
            </Head>
            <Script src="https://checkout.flutterwave.com/v3.js" strategy="lazyOnload" />
            
            <div className="subscription-section recruiter-sub">
                <div className="section-header">
                    <h2>Unlock Recruiter PRO</h2>
                    <p>Subscribe to post jobs, view applicant details, and access all our hiring tools.</p>
                </div>
                <div className="pricing-grid">
                    <div className="plan-card popular">
                        <h3>{proPlan.name}</h3>
                        <div className="plan-price">
                            <span className="price-amount">${proPlan.price}</span>
                            <span className="price-period">/{proPlan.period}</span>
                        </div>
                        <ul className="plan-features">
                            {proPlan.features.map((f, i) => (
                                <li key={i}>✓ {f}</li>
                            ))}
                        </ul>
                        {currentUser && !currentUser.isSubscribed ? 
                            <button type="button" className="purchase-btn" onClick={() => handlePayment(proPlan)}>
                                Get Started
                            </button>
                        :
                            <p className="subscribed-message">You are already a PRO member. Enjoy!</p>
                        }
                    </div>
                </div>
            </div>
        </>
    );
};


RecruiterSubscriptionPage.getLayout = function getLayout(page) {
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
        
        const user = jwt.verify(token, process.env.JWT_SECRET);
        if (user.role !== 'recruiter' && user.role !== 'admin') {
            return { redirect: { destination: '/', permanent: false } };
        }

        
        return {
            props: {
                user,
            },
        };
    } catch (error) {
        console.error("Recruiter Subscription SSR Error:", error);
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: '/login', permanent: false } };
    }
}

export default RecruiterSubscriptionPage;
import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { CheckIcon, fetchPaymentVerify, FLUTTERWAVE_PUBLIC_KEY, plans, userDashboard } from '../../constants';
import { AuthContext } from '@/context/AuthContext';
import toast from 'react-hot-toast';


const PlanCard = ({ plan, onPurchase }) => (
    <div className={`plan-card ${plan.isPopular ? 'popular' : ''}`}>
        {plan.isPopular && <div className="popular-badge">Most Popular</div>}
        <div className="plan-header">
            <h3>{plan.name}</h3>
        </div>
        <div className="plan-price">
            <span className="price-amount">${plan.price}</span>
            <span className="price-period">{plan.period}</span>
        </div>
        <ul className="plan-features">
            {plan.features.map((feature, index) => (
                <li key={index}>
                    <CheckIcon /> {feature}
                </li>
            ))}
        </ul>
        <button type="button" className="purchase-btn" onClick={() => onPurchase(plan)}>
            Purchase Now
        </button>
    </div>
);

function SubscriptionPlan(props) {
    const { user, login } = useContext(AuthContext);
    const router = useRouter();
    
    const handleVerification = async (transaction_id, fw_plan_id) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(fetchPaymentVerify, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ transaction_id, fw_plan_id })
            });
            
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Verification failed.');
            login(data.user, data.token);
            
            toast.success('Subscription activated successfully!');
        } catch (error) {
            toast.error('An error occurred during verification. Please contact support.');
        }
    };

    const handlePayment = (plan) => {
        if (!user) {
            toast('Please log in or create an account to subscribe.');
            router.push('/login');
            return;
        }

        let myStatus;
        if (props.current_plan > plan.price){
            myStatus = "Downgrade to ";
        } else if (props.current_plan < plan.price){
            myStatus = "Upgrade to ";
        } else {
            myStatus = '';
        }

        if (typeof FlutterwaveCheckout === 'function') {
            FlutterwaveCheckout({
                public_key: FLUTTERWAVE_PUBLIC_KEY,
                tx_ref: `jobshive-sub-${user.id}-${Date.now()}`,
                amount: plan.price,
                currency: 'USD',
                customer: { email: user.email, name: user.fullName },
                payment_plan: plan.fw_plan_id,
                customizations: {
                    title: `${myStatus} ${plan.plan_name} Subscription`,
                    logo: 'https://remotejobshive.co/favicon.ico',
                },
                callback: function (data) {
                    if (data.status === "successful") {
                        handleVerification(data.transaction_id, plan.fw_plan_id);
                        router.push('/dashboard/user');
                    } else {
                        toast.error('Payment was not successful. Please try again.');
                    }
                },
            });

        } else {
            toast.error('Payment gateway is still loading. Please try again in a moment.');
        }
    };

    return (
        <>
        <Script src="https://checkout.flutterwave.com/v3.js" strategy="lazyOnload" />
        <div className="subscription-section">
            <div className="section-header">
                <h2>Subscription Plans</h2>
                <p>Choose a plan that works for you and unlock premium features.</p>
            </div>
            <div className="pricing-grid">
                {plans.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} onPurchase={handlePayment} />
                ))}
            </div>
        </div>
        </>
    );
}

export default SubscriptionPlan;
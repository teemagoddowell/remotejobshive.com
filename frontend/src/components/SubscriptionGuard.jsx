import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '@/context/AuthContext';
import { recruiterDashboard, userDashboard } from '@/constants';

const SubscriptionGuard = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            if (!user.isSubscribed) {
                const redirectTo = user.role === 'recruiter' 
                    ? `${recruiterDashboard}/subscription` 
                    : `${userDashboard}/subscription`;
                
                router.replace(redirectTo);
            }
        }
    }, [user, loading, router]);

    if (loading || !user || !user.isSubscribed) {
        return <div>Loading...</div>;
    }

    return children;
};

export default SubscriptionGuard;
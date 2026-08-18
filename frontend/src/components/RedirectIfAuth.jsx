import React, { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '@/context/AuthContext';
import { recruiterDashboard, userDashboard } from '@/constants';

const RedirectIfAuth = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    const router = useRouter();
    
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!loading && user) {
            const redirectTo = user.role === 'recruiter' ? recruiterDashboard : userDashboard;
            router.replace(redirectTo);
        }
    }, [user, loading, router]);

    
    if (!isClient || loading || user) {
        return <div>Loading...</div>;
    }

    return children;
};

export default RedirectIfAuth;
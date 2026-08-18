import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '@/context/AuthContext';
import { login } from '@/constants';
import PermissionDenied from '@/pages/PermissionDenied'; 

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push(login);
        }
    }, [user, loading, router]);

    if (loading) {
        return <div>Loading session...</div>; 
    }

    if (!user) {
        return null;
    }

    if (!allowedRoles.includes(user.role)) {
        return <PermissionDenied />;
    }

    return children;
};

export default ProtectedRoute;
import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { fetchUserStatus } from '../constants';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const validateSession = async () => {
            const token = Cookies.get('token');
            
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(fetchUserStatus, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const latestUserData = await response.json();
                    setUser(latestUserData);
                    localStorage.setItem('user', JSON.stringify(latestUserData));
                } else {
                    logout();
                }
            } catch (error) {
                console.error("Session validation failed:", error);
                const storedUser = localStorage.getItem('user');
                if (storedUser) setUser(JSON.parse(storedUser));
            } finally {
                setLoading(false);
            }
        };

        validateSession();
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        Cookies.set('token', token, { expires: 10, secure: process.env.NODE_ENV === 'production' });
        
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        Cookies.remove('token');
        setUser(null);
        router.push("/");
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
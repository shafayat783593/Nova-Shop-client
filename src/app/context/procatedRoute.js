'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';


export default function PrivateRoute({ children }) {
    const router = useRouter();
    const { isAuth, loading } = useAuth();

    useEffect(() => {
        if (!loading && !isAuth) {
            router.replace('/login');
        }
    }, [loading, isAuth, router]);

    // While auth state is resolving
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <span className="text-sm text-muted-foreground">Checking authentication…</span>
            </div>
        );
    }

    // Block rendering until authenticated
    if (!isAuth) return null;

    return children;
}
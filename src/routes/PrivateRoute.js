'use client';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Loading from '../app/loading';

// ─── Base HOC ─────────────────────────────────────────────────────────────────
// All three guards share the same logic — only the allowed role differs.

function createPrivateRoute(allowedRole) {
    return function PrivateRoute({ children }) {
        const router = useRouter();
        const { user, isInitialLoading } = useSelector((state) => state.auth);
        useEffect(() => {
            if (!isInitialLoading) {
                if (!user) {
                    router.replace('/login');
                } else if (user.role !== allowedRole) {
                    router.replace('/unauthorized');
                }
            }
        }, [user, isInitialLoading, router]);

        // 1. Still resolving auth state
        if (isInitialLoading) {
            return <Loading label="Validating Identity" />;
        }

        // 2. Not authed or wrong role — render nothing while redirect fires
        if (!user || user.role !== allowedRole) {
            return null;
        }

        // 3. Correct role — render the protected page
        return children;
    };
}

// ─── Three Guards ─────────────────────────────────────────────────────────────

export const UserRoute = createPrivateRoute('customer');
export const DeliveryboyRoute = createPrivateRoute('deliveryboy');
export const OwnerRoute = createPrivateRoute('owner');
export const AdminRoute = createPrivateRoute('admin');
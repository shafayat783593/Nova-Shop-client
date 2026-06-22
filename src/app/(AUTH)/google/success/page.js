'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import toast from 'react-hot-toast';

const GoogleSuccessPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { fetchUser } = useAuth();

    useEffect(() => {
        const handleGoogleSuccess = async () => {
            const error = searchParams.get('error');

            if (error === 'MAX_SESSIONS_REACHED') {
                toast.error('Maximum devices reached. Please logout from another device first.');
                router.push('/login');
                return;
            }

            if (error) {
                toast.error('Google login failed. Please try again.');
                router.push('/login');
                return;
            }

            // csrfToken query param থেকে নিয়ে localStorage-এ রাখো
            const csrfToken = searchParams.get('csrfToken');
            if (csrfToken) {
                localStorage.setItem('csrfToken', csrfToken);
            }

            try {
                const user = await fetchUser();
                toast.success(`Welcome, ${user?.name}!`);

                const roleRedirects = {
                    admin: '/admin',
                    vendor: '/vendor',
                    deliveryboy: '/deliveryboy',
                    customer: '/',
                };

                router.push(roleRedirects[user?.role] || '/');
            } catch {
                toast.error('Something went wrong. Please login again.');
                router.push('/login');
            }
        };

        handleGoogleSuccess();
    }, []);

return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            <p className="text-body text-sm">Signing you in...</p>
        </div>
    </div>
);
};

export default GoogleSuccessPage;
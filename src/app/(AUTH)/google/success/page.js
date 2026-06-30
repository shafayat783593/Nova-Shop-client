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
        if (error) {
            toast.error(error === 'MAX_SESSIONS_REACHED' ? 'Maximum devices reached.' : 'Google login failed.');
            router.push('/login');
            return;
        }

        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const csrfToken = searchParams.get('csrfToken');
        const returnUrl = searchParams.get('returnUrl') || '/';

        if (!accessToken || !refreshToken) {
            toast.error('Login failed. Please try again.');
            router.push('/login');
            return;
        }

        const isProduction = window.location.hostname !== 'localhost';
        const secure = isProduction ? 'Secure;' : '';

        document.cookie = `accessToken=${accessToken}; Path=/; ${secure} SameSite=Lax; Max-Age=900`;
        document.cookie = `refreshToken=${refreshToken}; Path=/; ${secure} SameSite=Lax; Max-Age=604800`;
        document.cookie = `csrfToken=${csrfToken}; Path=/; ${secure} SameSite=Lax; Max-Age=604800`;

        // cookie settle হওয়ার জন্য fetchUser আগেই call করে নাও (navigate করার আগে)
        const user = await fetchUser().catch(() => null);
        if (user) toast.success(`Welcome, ${user?.name}!`);

        window.location.href = decodeURIComponent(returnUrl);
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
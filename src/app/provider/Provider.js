'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from 'next-themes';
import SmoothProvider from '../components/global/SmoothProvider';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from '../context/Cartcontext';



export default function Provider({ children }) {
    const [queryClient] = useState(() =>
        new QueryClient({
            defaultOptions: {
                queries: {
                    staleTime: 60 * 1000,
                },
            },
        })
    );

    return (

        <QueryClientProvider client={queryClient}>
            <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem={false}
                disableTransitionOnChange={false} >
                <Toaster position="top-right" reverseOrder={false} />
                    <AuthProvider>
                        <CartProvider>
                        <SmoothProvider>
                            {children}
                        </SmoothProvider>
                    </CartProvider>
                    </AuthProvider>
               
            </ThemeProvider>
        </QueryClientProvider>

    );
}

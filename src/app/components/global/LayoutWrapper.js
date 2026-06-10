'use client';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion'; 
import Navbar from './Navbar';
import Footer from './Footer';
import ChatWidget from '@/app/chat/Chatwidget';


export default function LayoutWrapper({ children }) {
    const pathname = usePathname();

    const hideNavFooter = ['/customer',"/admin","/vendor", "/deliveryboy", '/login', '/register', '/verify', "/reset-password","/Forgot-password"].some((path) =>
        pathname.startsWith(path)
    );

    if (hideNavFooter) {
        return <>{children}</>;
    }

    return (
        <>
            <Navbar key={pathname} />

      
            <AnimatePresence mode="wait">
                <motion.main
                    key={pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    {children}
                          {user?.role === "customer" && <ChatWidget />}

                </motion.main>
            </AnimatePresence>

            <Footer />
        </>
    );
}

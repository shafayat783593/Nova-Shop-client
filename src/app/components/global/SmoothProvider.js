"use client";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function SmoothProvider({ children }) {
    const pathname = usePathname();

    return (
        <motion.div
            key={pathname}
            initial={false}
            animate={{
                // Changed from --color-bg to --bg
                backgroundColor: "var(--bg)",
                // Changed from --color-body to --text-main
                color: "var(--text-main)",
            }}
            transition={{
                duration: 0.5,
                ease: "easeInOut"
            }}
            className="min-h-screen"
        >
            {children}
        </motion.div>
    );
}

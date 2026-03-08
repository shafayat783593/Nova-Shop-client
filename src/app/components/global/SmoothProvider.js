"use client";
import { motion } from "framer-motion";

export default function SmoothProvider({ children }) {
    return (
        <motion.div
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
"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggler() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative p-3 rounded-xl bg-secondary hover:bg-accent overflow-hidden transition-colors"
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={theme}
                    initial={{ y: -20, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.3 }}
                >
                    {theme === "dark" ? (
                        <Sun className="w-5 h-5 text-primary" />
                    ) : (
                        <Moon className="w-5 h-5 text-primary" />
                    )}
                </motion.div>
            </AnimatePresence>
        </button>
    );
}
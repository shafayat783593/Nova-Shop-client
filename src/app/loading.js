"use client";
import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-bg">
      <div className="relative">
        {/* Outer Pulsing Ring */}
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.1, 0.3],
            borderWidth: ["2px", "8px", "2px"],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-8 rounded-full border-accent opacity-20"
        />

        {/* Main Spinning Geometry */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="relative h-20 w-20"
        >
          {[...Array(4)].map((_, i) => (
            <motion.span
              key={i}
              style={{ rotate: i * 90 }}
              className="absolute inset-0 flex items-start justify-center"
            >
              <motion.span
                animate={{
                  scale: [1, 1.5, 1],
                  borderRadius: ["20%", "50%", "20%"]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="h-4 w-4 bg-primary shadow-[0_0_15px_var(--color-primary)]"
              />
            </motion.span>
          ))}
        </motion.div>
      </div>

      {/* Text using Theme Fonts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12 text-center"
      >
        <h2 className="font-display text-2xl font-bold tracking-widest text-primary uppercase">
          Loading
        </h2>
        <p className="font-sans text-sm text-text-main/60 mt-2 tracking-tighter">
          Synchronizing your environment...
        </p>
      </motion.div>
    </div>
  );
}
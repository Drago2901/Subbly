import React from 'react';
import { motion } from 'framer-motion';

export function GlassLoginCard({ children, hasError }: { children: React.ReactNode, hasError?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(20px)' }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        filter: 'blur(0px)',
        x: hasError ? [-10, 10, -10, 10, 0] : 0 // Shake on error
      }}
      exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
      transition={{ 
        duration: 0.6, 
        type: "spring", 
        bounce: 0.3,
        x: { type: "spring", stiffness: 300, damping: 10 } // specific transition for shake
      }}
      className="w-full max-w-[400px] p-8 md:p-10 rounded-[28px] border border-white/10"
      style={{
        background: 'rgba(20,20,22,0.55)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
        borderTop: '1px solid rgba(255,255,255,0.15)' // subtle orange reflection near top edge could be done via gradient
      }}
    >
      {children}
    </motion.div>
  );
}

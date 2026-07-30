import React from 'react';
import { motion } from 'framer-motion';

interface GhostMascotProps {
  lampOn: boolean;
  isHoveringChain: boolean;
  hasError?: boolean;
}

export function GhostMascot({ lampOn, isHoveringChain, hasError }: GhostMascotProps) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Speech Bubble */}
      <motion.div 
        className="absolute bottom-[110%] w-[140px] border-[1.5px] border-white/20 rounded-[18px] p-3 text-[13px] leading-relaxed text-[#eee] bg-[#141416]/80 backdrop-blur-md"
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ 
          opacity: (lampOn && !hasError) ? 0 : 1,
          y: (lampOn && !hasError) ? 10 : 0,
          scale: (lampOn && !hasError) ? 0.95 : 1
        }}
        transition={{ duration: 0.4 }}
      >
        {!lampOn && (
          <>
            Oops...<br/>
            It's dark here!<br/>
            <b className="text-[#FF7A00] font-bold">Pull the lamp!</b>
          </>
        )}
        {lampOn && hasError && (
          <span className="text-[#FF7A00] font-medium">Let's try again!</span>
        )}
      </motion.div>

      {/* Ghost SVG */}
      <motion.svg 
        className="w-[80px] drop-shadow-[0_10px_16px_rgba(0,0,0,0.6)]" 
        viewBox="0 0 100 110" 
        fill="none"
        animate={{
          y: isHoveringChain ? -8 : (lampOn ? -4 : 0),
          rotate: isHoveringChain ? 5 : 0
        }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        {/* Body */}
        <path d="M10 70 C10 30 28 6 50 6 C72 6 90 30 90 70 L90 100 L78 88 L66 100 L54 88 L46 88 L34 100 L22 88 L10 100 Z" fill="#EDEDED"/>
        
        {/* Eyes */}
        <motion.circle 
          cx="36" cy="55" r="5" fill="#2b2b2b"
          animate={{
            cy: !lampOn ? 45 : 55, // Look up if dark
            cx: isHoveringChain ? 40 : 36 // Look right if hovering chain
          }}
        />
        <motion.circle 
          cx="64" cy="55" r="5" fill="#2b2b2b"
          animate={{
            cy: !lampOn ? 45 : 55,
            cx: isHoveringChain ? 68 : 64
          }}
        />

        {/* Mouth */}
        <motion.path 
          stroke="#2b2b2b" strokeWidth="2.5" strokeLinecap="round" fill="none"
          animate={{
            d: hasError 
                ? "M40 72 Q50 64 60 72" // Sad/confused mouth
                : (lampOn 
                    ? "M40 68 Q50 78 60 68" // Big smile
                    : "M45 68 Q50 68 55 68" // Neutral/straight
                  )
          }}
        />

        {/* Cheeks (Glow when on) */}
        <motion.circle 
          cx="24" cy="66" r="4" fill="#FFB27A" 
          initial={{ opacity: 0 }}
          animate={{ opacity: lampOn ? 0.7 : 0 }}
        />
        <motion.circle 
          cx="76" cy="66" r="4" fill="#FFB27A" 
          initial={{ opacity: 0 }}
          animate={{ opacity: lampOn ? 0.7 : 0 }}
        />

        {/* Little hand pointing when hovering chain */}
        <motion.path 
          d="M80 60 Q95 50 100 40" 
          stroke="#EDEDED" strokeWidth="6" strokeLinecap="round" fill="none"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ 
            opacity: (!lampOn && isHoveringChain) ? 1 : 0,
            pathLength: (!lampOn && isHoveringChain) ? 1 : 0
          }}
        />
      </motion.svg>
    </div>
  );
}

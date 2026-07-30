import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { LampFixture } from './LampFixture';
import { CinematicLight } from './CinematicLight';
import { GhostMascot } from './GhostMascot';
import { GlassLoginCard } from './GlassLoginCard';
import './PremiumLamp.css';

export function PremiumLampScene({ children, hasError }: { children: React.ReactNode, hasError?: boolean }) {
  const [lampOn, setLampOn] = useState(() => localStorage.getItem('lampActivated') === 'true');
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringChain, setIsHoveringChain] = useState(false);
  
  // Mouse tracking for subtle sway
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 });
  
  const lampRotate = useTransform(springX, [-1000, 1000], [-5, 5]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!lampOn) return;
      const x = e.clientX - window.innerWidth / 2;
      const y = e.clientY - window.innerHeight / 2;
      mouseX.set(x);
      mouseY.set(y);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [lampOn, mouseX, mouseY]);

  useEffect(() => {
    if (lampOn) {
      localStorage.setItem('lampActivated', 'true');
    }
  }, [lampOn]);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#09090B]">
      {/* Subtle vignette and film grain */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.5)_100%)] mix-blend-multiply opacity-50" />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] premium-grain" />

      {/* Cinematic ambient orange haze behind everything */}
      <motion.div 
        className="pointer-events-none absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: lampOn ? 0.08 : 0 }}
        transition={{ duration: 2, ease: "easeInOut" }}
        style={{
          background: 'radial-gradient(circle at 50% 30%, #FF7A00 0%, transparent 60%)'
        }}
      />

      {/* The main scene container */}
      <div className="relative z-10 w-full max-w-[1200px] min-h-[800px] h-screen flex flex-col items-center pt-8">
        
        {/* Lamp Fixture & Light */}
        <motion.div 
          className="relative flex flex-col items-center origin-top"
          style={{ rotate: lampRotate }}
        >
          <LampFixture 
            lampOn={lampOn} 
            setLampOn={setLampOn}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            setIsHoveringChain={setIsHoveringChain}
          />
          <CinematicLight lampOn={lampOn} mouseX={springX} mouseY={springY} />
        </motion.div>

        {/* Ghost Mascot - Lower Left */}
        <div className="absolute bottom-[10%] left-[8%] hidden lg:block z-20">
          <GhostMascot 
            lampOn={lampOn} 
            isHoveringChain={isHoveringChain}
            hasError={hasError}
          />
        </div>

        {/* Glass Login Card - Offset Lower Right */}
        <div className="absolute top-[40%] md:right-[15%] right-auto px-4 w-full md:w-auto z-30 flex justify-center">
          <AnimatePresence>
            {lampOn && (
              <GlassLoginCard hasError={hasError}>
                {children}
              </GlassLoginCard>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

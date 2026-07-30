import React, { useEffect, useRef } from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';

interface CinematicLightProps {
  lampOn: boolean;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}

export function CinematicLight({ lampOn, mouseX, mouseY }: CinematicLightProps) {
  const particlesRef = useRef<HTMLDivElement>(null);

  // Dynamic light swinging based on mouse X/Y
  const lightRotateX = useTransform(mouseY, [-1000, 1000], [5, -5]);
  const lightRotateY = useTransform(mouseX, [-1000, 1000], [-5, 5]);

  useEffect(() => {
    // Generate particles only once
    if (particlesRef.current && particlesRef.current.childElementCount === 0) {
      for(let i=0; i<30; i++) {
        const p = document.createElement('div');
        p.className = 'absolute w-[3px] h-[3px] rounded-full bg-[#FFD799] opacity-0';
        
        // Randomize placement inside the bounding box
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        p.style.left = `${left}%`;
        p.style.top = `${top}%`;
        p.style.filter = 'blur(0.5px)';
        
        // Randomize animation
        const dx = (Math.random() * 40 - 20) + 'px';
        const dy = -(Math.random() * 100 + 50) + 'px';
        p.style.setProperty('--dx', dx);
        p.style.setProperty('--dy', dy);
        
        const duration = 5 + Math.random() * 6;
        const delay = Math.random() * 5;
        p.style.animation = `floatParticle ${duration}s linear ${delay}s infinite`;
        
        particlesRef.current.appendChild(p);
      }
    }
  }, []);

  return (
    <>
      {/* CSS Keyframes for particles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatParticle {
          0% { transform: translate(0, 0); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.5; }
          100% { transform: translate(var(--dx), var(--dy)); opacity: 0; }
        }
      `}} />

      <motion.div 
        className="absolute top-[80px] w-[800px] h-[700px] pointer-events-none origin-top flex flex-col items-center"
        style={{
          rotateX: lightRotateX,
          rotateY: lightRotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Layer 2: Soft Cone */}
        <motion.div 
          className="absolute top-0 w-0 h-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: lampOn ? 1 : 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            borderLeft: '240px solid transparent',
            borderRight: '240px solid transparent',
            borderTop: '600px solid rgba(255, 160, 50, 0.12)',
            filter: 'blur(20px)',
          }}
        />

        {/* Layer 3: Inner Bright Cone */}
        <motion.div 
          className="absolute top-0 w-0 h-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: lampOn ? 1 : 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            borderLeft: '140px solid transparent',
            borderRight: '140px solid transparent',
            borderTop: '500px solid rgba(255, 200, 100, 0.08)',
            filter: 'blur(30px)',
          }}
        />

        {/* Layer 4: Floor Illumination (Ellipse at the bottom of the cone) */}
        <motion.div 
          className="absolute top-[500px] w-[600px] h-[150px] rounded-[50%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: lampOn ? 1 : 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255,150,50,0.15) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />

        {/* Layer 5: Ambient Particles (Masked to Cone) */}
        <motion.div 
          className="absolute top-0 w-[500px] h-[600px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: lampOn ? 0.15 : 0 }}
          transition={{ duration: 1.5 }}
          style={{
            // Mask the rectangular div so particles only appear inside the cone shape
            maskImage: 'polygon(50% 0%, 100% 100%, 0% 100%)',
            WebkitMaskImage: 'polygon(50% 0%, 100% 100%, 0% 100%)',
          }}
          ref={particlesRef}
        />
      </motion.div>
    </>
  );
}

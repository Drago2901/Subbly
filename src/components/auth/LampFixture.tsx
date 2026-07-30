import React, { useRef } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';

interface LampFixtureProps {
  lampOn: boolean;
  setLampOn: React.Dispatch<React.SetStateAction<boolean>>;
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  setIsHoveringChain: React.Dispatch<React.SetStateAction<boolean>>;
}

export function LampFixture({ lampOn, setLampOn, isDragging, setIsDragging, setIsHoveringChain }: LampFixtureProps) {
  const chainY = useMotionValue(0);
  const chainSpringY = useTransform(chainY, [0, 50], [0, 50], { clamp: true });

  const playClick = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.value = 900;
      g.gain.value = 0.05;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      o.stop(ctx.currentTime + 0.09);
    } catch(e) {}
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (chainY.get() > 30) {
      if (!lampOn) {
        setLampOn(true);
        playClick();
      }
    }
    // Snap back
    chainY.set(0);
  };

  return (
    <div className="relative flex flex-col items-center w-[300px] select-none -mt-4 z-40">
      {/* Power Cord */}
      <div className="w-[3px] h-[80px] bg-gradient-to-b from-[#111] to-[#222] shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
      
      {/* Matte Black Shade */}
      <div className="relative w-[180px] h-[80px] bg-gradient-to-b from-[#1b1b1e] to-[#0f0f11] rounded-b-full border-b-[3px] border-b-[#2a2a2d] shadow-[0_12px_24px_rgba(0,0,0,0.8)] z-10 flex justify-center">
        {/* Inner rim reflection */}
        <div className="absolute bottom-[3px] w-[160px] h-[16px] rounded-[50%] bg-gradient-to-b from-transparent to-[#222]" />
        
        {/* Bulb when ON */}
        <motion.div 
          className="absolute bottom-[-6px] w-[22px] h-[22px] rounded-full bg-[#FFF0D4]"
          initial={{ opacity: 0 }}
          animate={{ opacity: lampOn ? 1 : 0 }}
          transition={{ duration: 0.1 }}
          style={{
            boxShadow: '0 0 16px 8px #FFF0D4, 0 0 40px 20px #FF7A00, 0 0 80px 40px rgba(255,122,0,0.6)'
          }}
        />
        {/* Bulb when OFF */}
        <motion.div 
          className="absolute bottom-[-6px] w-[22px] h-[22px] rounded-full bg-[#444]"
          initial={{ opacity: 1 }}
          animate={{ opacity: lampOn ? 0 : 1 }}
        />
      </div>

      {/* Pull Chain */}
      <motion.div 
        className="absolute top-[160px] flex flex-col items-center cursor-grab active:cursor-grabbing z-0 pb-10"
        drag="y"
        dragConstraints={{ top: 0, bottom: 50 }}
        dragElastic={0.2}
        style={{ y: chainSpringY }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        onHoverStart={() => setIsHoveringChain(true)}
        onHoverEnd={() => setIsHoveringChain(false)}
      >
        {/* Chain Line */}
        <div 
          className="w-[1.5px] h-[90px]"
          style={{
            background: lampOn 
              ? 'repeating-linear-gradient(#8a7050 0, #8a7050 4px, transparent 4px, transparent 8px)'
              : 'repeating-linear-gradient(#555 0, #555 4px, transparent 4px, transparent 8px)'
          }}
        />
        {/* Knob */}
        <div className="w-[16px] h-[22px] rounded-[10px] bg-gradient-to-b from-[#d99a4a] to-[#a5651f] shadow-[0_2px_8px_rgba(0,0,0,0.8)] -mt-1" />
        
        {/* Hint text */}
        <motion.div 
          className="mt-4 text-[12px] font-medium text-white/40 tracking-wide text-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: lampOn || isDragging ? 0 : 1 }}
        >
          Pull the chain to<br/>turn on the lamp
        </motion.div>
      </motion.div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface RainBackgroundProps {
  initialDensity?: number;
  initialWind?: number;
  initialSpeed?: number;
}

export const RainBackground: React.FC<RainBackgroundProps> = ({
  initialDensity = 150,
  initialWind = 20,
  initialSpeed = 180,
}) => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [density, setDensity] = useState(initialDensity);
  const [wind, setWind] = useState(initialWind);
  const [speed, setSpeed] = useState(initialSpeed);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W: number, H: number;
    let animationFrameId: number;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    class Drop {
      x!: number;
      y!: number;
      len!: number;
      speedMult!: number;
      glint!: boolean;
      opacity!: number;

      constructor() {
        this.reset(true);
      }

      reset(randomY = false) {
        this.x = Math.random() * (W + 200) - 100;
        this.y = randomY ? Math.random() * H : -20;
        this.len = 10 + Math.random() * 20;
        this.speedMult = 0.6 + Math.random() * 0.8;
        this.glint = Math.random() < 0.06; // rare orange-tinted drop
        this.opacity = 0.2 + Math.random() * 0.5;
      }

      update(dt: number, currentWind: number, currentSpeed: number) {
        const vy = currentSpeed * this.speedMult;
        const vx = currentWind * this.speedMult;
        this.y += vy * dt;
        this.x += vx * dt;

        if (this.y > H + 20 || this.x < -100 || this.x > W + 100) {
          this.reset();
        }
      }

      draw(currentWind: number, currentSpeed: number) {
        if (!ctx) return;
        const vy = currentSpeed * this.speedMult;
        const vx = currentWind * this.speedMult;
        const angle = Math.atan2(vy, vx || 0.0001);
        const dx = Math.cos(angle) * this.len;
        const dy = Math.sin(angle) * this.len;

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - dx, this.y - dy);
        
        const isLight = theme === 'light';
        if (isLight) {
          ctx.strokeStyle = this.glint
            ? `rgba(255, 122, 0, ${this.opacity})`
            : `rgba(255, 92, 58, ${this.opacity * 0.6})`;
        } else {
          ctx.strokeStyle = this.glint
            ? `rgba(255, 122, 0, ${this.opacity * 0.8})`
            : `rgba(180, 200, 220, ${this.opacity})`;
        }
        
        ctx.lineWidth = this.glint ? 1.4 : 1;
        ctx.stroke();
      }
    }

    let drops: Drop[] = [];
    const setDropCount = (n: number) => {
      if (drops.length < n) {
        for (let i = drops.length; i < n; i++) drops.push(new Drop());
      } else {
        drops.length = n;
      }
    };
    
    setDropCount(density);

    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      ctx.clearRect(0, 0, W, H);

      for (const d of drops) {
        d.update(dt, wind, speed);
        d.draw(wind, speed);
      }

      animationFrameId = requestAnimationFrame(frame);
    };

    animationFrameId = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [density, wind, speed, theme]);

  return (
    <div id="rain-background-wrapper">
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 50,
          display: 'block',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 51,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: 'rgba(10, 10, 10, 0.4)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          pointerEvents: 'auto',
          boxShadow: '0 4px 24px -4px rgba(0, 0, 0, 0.5)',
        }}
      >
        <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          DENSITY
          <input
            type="range"
            min="40"
            max="400"
            value={density}
            onChange={(e) => setDensity(parseInt(e.target.value))}
            style={{ accentColor: '#ff5c3a', width: '100px' }}
          />
        </label>
        <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          WIND
          <input
            type="range"
            min="-100"
            max="100"
            value={wind}
            onChange={(e) => setWind(parseInt(e.target.value))}
            style={{ accentColor: '#ff5c3a', width: '100px' }}
          />
        </label>
        <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          SPEED
          <input
            type="range"
            min="50"
            max="400"
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            style={{ accentColor: '#ff5c3a', width: '100px' }}
          />
        </label>
      </div>
    </div>
  );
};

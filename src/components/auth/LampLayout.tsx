import { useEffect, useRef, useState } from 'react';
import '../../pages/Auth.css'; // Make sure we import the CSS

export function LampLayout({ children, isSuccess }: { children: React.ReactNode, isSuccess?: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const chainLineRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  
  const [lampOn, setLampOn] = useState(() => localStorage.getItem("lampActivated") === "true");
  const [dragging, setDragging] = useState(false);
  const [startY, setStartY] = useState(0);

  useEffect(() => {
    // Generate particles
    if (particlesRef.current && particlesRef.current.childElementCount === 0) {
      for(let i=0;i<26;i++){
        const p = document.createElement('div');
        p.className = 'lamp-particle';
        const left = 30 + Math.random()*20; // around lamp cone, in %
        const top = 20 + Math.random()*35;
        p.style.left = left+'%';
        p.style.top = top+'%';
        p.style.setProperty('--dx', (Math.random()*40-20)+'px');
        p.style.animationDuration = (4 + Math.random()*5)+'s';
        p.style.animationDelay = (Math.random()*6)+'s';
        particlesRef.current.appendChild(p);
      }
    }
  }, []);

  useEffect(() => {
    if (lampOn) {
      stageRef.current?.classList.add('lamp-on');
      localStorage.setItem("lampActivated", "true");
    }
  }, [lampOn]);

  useEffect(() => {
    if (isSuccess && stageRef.current) {
      stageRef.current.style.setProperty('--extra-glow', '0.18');
    }
  }, [isSuccess]);

  const playClick = () => {
    try{
      const ctx = new (window.AudioContext||(window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type='square';
      o.frequency.value=900;
      g.gain.value=0.05;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+0.08);
      o.stop(ctx.currentTime+0.09);
    }catch(e){}
  };

  const turnOn = () => {
    if(lampOn) return;
    setLampOn(true);
    playClick();
  };

  const pullFeedback = (active: boolean) => {
    if (chainLineRef.current) {
      chainLineRef.current.style.height = active ? '104px' : '90px';
    }
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if(dragging){
        setDragging(false);
        pullFeedback(false);
      }
    };
    window.addEventListener('pointerup', handleMouseUp);
    return () => window.removeEventListener('pointerup', handleMouseUp);
  }, [dragging]);

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if(!lampOn || !stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    const mx = (((e as MouseEvent).clientX-r.left)/r.width*100).toFixed(1);
    const my = (((e as MouseEvent).clientY-r.top)/r.height*100).toFixed(1);
    stageRef.current.style.setProperty('--mx', `calc(38% + (${mx}% - 38%) * 0.12)`);
    stageRef.current.style.setProperty('--my', `calc(30% + (${my}% - 30%) * 0.08)`);
  };

  return (
    <div 
      className={`lamp-stage ${lampOn ? 'lamp-on' : ''}`} 
      id="stage" 
      ref={stageRef}
      onMouseMove={handleMouseMove}
    >
      <div className="lamp-logo">
        <span className="mark"><svg viewBox="0 0 24 24"><polygon points="6,4 20,12 6,20"/></svg></span>
        Subbly
      </div>

      <div className="lamp-particles" id="particles" ref={particlesRef}></div>

      <div className="lamp-wrap">
        <div className="lamp-cord"></div>
        <div className="lamp-shade-glow"></div>
        <div className="lamp-cone"></div>
        <div className="lamp-shade"></div>
        <div 
          className="lamp-chain" 
          id="chain"
          onClick={() => { pullFeedback(true); setTimeout(()=>pullFeedback(false),150); turnOn(); }}
          onPointerDown={(e) => {
            setDragging(true);
            setStartY(e.clientY);
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if(!dragging) return;
            const dy = e.clientY - startY;
            if(dy > 6) pullFeedback(true);
            if(dy > 28){ turnOn(); setDragging(false); setTimeout(()=>pullFeedback(false),150); }
          }}
        >
          <div className="lamp-chain-line" id="chainLine" ref={chainLineRef}></div>
          <div className="lamp-chain-knob" id="knob"></div>
          <div className="lamp-pull-hint">Pull the chain to<br/>turn on the lamp</div>
        </div>
      </div>

      <div className="lamp-mascot">
        <div className="lamp-bubble">Oops... it's dark here!<br/><b>Pull the lamp!</b></div>
        <svg className="lamp-ghost" viewBox="0 0 100 110" fill="none">
          <path d="M10 70 C10 30 28 6 50 6 C72 6 90 30 90 70 L90 100 L78 88 L66 100 L54 88 L46 88 L34 100 L22 88 L10 100 Z" fill="#EDEDED"/>
          <circle cx="36" cy="55" r="5" fill="#2b2b2b"/>
          <circle cx="64" cy="55" r="5" fill="#2b2b2b"/>
          <path d="M40 68 Q50 76 60 68" stroke="#2b2b2b" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <circle cx="24" cy="66" r="4" fill="#FFB27A" opacity="0.7"/>
          <circle cx="76" cy="66" r="4" fill="#FFB27A" opacity="0.7"/>
        </svg>
      </div>

      <div className={`lamp-login-card ${lampOn ? 'lamp-reveal' : ''}`} id="loginCard">
        {children}
      </div>

      <div className="lamp-badges">
        <span>⚡ AI Powered</span>
        <span>⚡ Fast &amp; Accurate</span>
        <span>🔒 Secure</span>
      </div>
    </div>
  );
}

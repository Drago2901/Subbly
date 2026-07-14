import { useEffect, useRef, useState } from "react";

const WORD_POOL = [
  "Subbly", "AI", "Captions", "Subtitle", "Timeline", "Translate", "Auto", "Editor",
  "Export", "Animation", "TikTok", "Instagram", "YouTube", "Shorts", "Reels",
  "Podcast", "Netflix", "Template", "Neon", "Glow", "Motion", "Sync",
  "Watermark-Free", "Premium", "4K", "MP4", "Render", "Trim", "Crop",
  "Auto Correct", "Voice", "Speaker", "Scene", "Audio", "Video", "99% Accuracy",
  "0:03", "0:08", "00:15", "00:30", "English", "Hindi", "Japanese", "German",
  "Spanish", "French", "Caption Style", "Cinematic", "Karaoke", "Modern",
  "Minimal", "Creator", "Content", "Viral", "Trending"
];

export function FloatingCaptionBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [wordCount, setWordCount] = useState(18);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) {
        setWordCount(8);
      } else if (w < 1024) {
        setWordCount(12);
      } else {
        setWordCount(18);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect prefers-reduced-motion
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Word spans
    const spans = Array.from(container.children) as HTMLSpanElement[];
    if (spans.length === 0) return;

    interface WordParticle {
      el: HTMLSpanElement;
      text: string;
      xPct: number;
      y: number;
      speed: number;
      baseOpacity: number;
      rotation: number;
      fontSize: number;
      fontWeight: number;
      blur: boolean;
      sinePeriod: number;
      sineAmp: number;
    }

    const particles: WordParticle[] = spans.map((span) => {
      const text = WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];
      return {
        el: span,
        text: Math.random() > 0.5 ? text.toUpperCase() : text,
        xPct: 5 + Math.random() * 90,
        y: container.clientHeight + Math.random() * 400 + 50,
        speed: 0.2 + Math.random() * 0.35,
        baseOpacity: 0.05 + Math.random() * 0.05,
        rotation: -4 + Math.random() * 8,
        fontSize: 12 + Math.floor(Math.random() * 9),
        fontWeight: Math.random() > 0.5 ? 600 : 400,
        blur: Math.random() > 0.8,
        sinePeriod: 100 + Math.random() * 200,
        sineAmp: 3 + Math.random() * 5
      };
    });

    // Track mouse position
    let mouseX = -9999;
    let mouseY = -9999;
    let isTouch = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (isTouch) return;
      const rect = container.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
    };

    const handleTouchStart = () => {
      isTouch = true;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchstart", handleTouchStart, { passive: true });

    let animationFrameId: number;
    let frame = 0;

    const tick = () => {
      frame++;
      const rect = container.getBoundingClientRect();
      const height = rect.height;
      const width = rect.width;

      particles.forEach((p) => {
        if (!reducedMotion) {
          // Drifts upward
          p.y -= p.speed;

          // Recycle when leaving the top
          if (p.y < -50) {
            p.y = height + Math.random() * 200 + 50;
            p.xPct = 5 + Math.random() * 90;
            const newText = WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];
            p.text = Math.random() > 0.5 ? newText.toUpperCase() : newText;
            p.speed = 0.2 + Math.random() * 0.35;
          }
        } else {
          // Static placement if prefers-reduced-motion is true
          if (p.y > height) {
            p.y = Math.random() * height;
          }
        }

        // Horizontal drift using sine wave
        const xOffset = Math.sin(frame / p.sinePeriod) * p.sineAmp;
        const currentX = (p.xPct / 100) * width + xOffset;

        // Interaction calculations
        let opacity = p.baseOpacity;
        let scale = 1;
        let spacing = 0;
        let color = "rgba(255, 255, 255, 0.08)";
        let glow = "none";

        if (mouseX !== -9999 && !reducedMotion && !isTouch) {
          const dx = mouseX - currentX;
          const dy = mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 170) {
            const factor = (170 - dist) / 170; // 0 (far) to 1 (cursor)
            opacity = p.baseOpacity + (0.9 - p.baseOpacity) * factor;
            scale = 1 + 0.35 * factor;
            spacing = 0.5 * factor;
            color = `rgb(255, 106, 61)`; // Subbly orange
            glow = `0 0 12px rgba(255, 106, 61, ${0.45 * factor})`;
          }
        }

        // Apply visual parameters direct to span styles
        p.el.textContent = p.text;
        p.el.style.fontSize = `${p.fontSize}px`;
        p.el.style.fontWeight = p.fontWeight.toString();
        p.el.style.opacity = opacity.toString();
        p.el.style.color = color;
        p.el.style.letterSpacing = `${spacing}px`;
        p.el.style.textShadow = glow;
        p.el.style.filter = p.blur ? "blur(0.2px)" : "none";
        p.el.style.transform = `translate3d(${currentX}px, ${p.y}px, 0) scale(${scale}) rotate(${p.rotation}deg)`;
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchstart", handleTouchStart);
    };
  }, [wordCount]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {Array.from({ length: wordCount }).map((_, i) => (
        <span
          key={i}
          className="absolute left-0 top-0 font-mono whitespace-nowrap"
          style={{
            transform: "translate3d(0, -9999px, 0)",
            willChange: "transform, opacity, letter-spacing, text-shadow, color",
            transition: "color 180ms ease, opacity 180ms ease, letter-spacing 180ms ease, text-shadow 180ms ease"
          }}
        />
      ))}
    </div>
  );
}

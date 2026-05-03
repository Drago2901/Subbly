import { useEffect, useRef, useState } from "react";

type Bubble = {
  id: number;
  x: number; // vw
  size: number; // px
  duration: number; // s
  delay: number; // s
  hue: number;
  popped: boolean;
};

/**
 * Liquid-fill progress display with full-screen floating bubbles
 * that the user can pop by tapping/clicking.
 */
export function LiquidProgress({
  value,
  label,
  sublabel,
}: {
  value: number; // 0-100
  label?: string;
  sublabel?: string;
}) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const idRef = useRef(0);

  // Continuously spawn bubbles across the viewport while mounted
  useEffect(() => {
    let cancelled = false;
    const spawn = () => {
      if (cancelled) return;
      setBubbles((prev) => {
        // cap to avoid runaway DOM
        const trimmed = prev.length > 40 ? prev.slice(-30) : prev;
        const size = 24 + Math.random() * 56;
        const duration = 6 + Math.random() * 7;
        const b: Bubble = {
          id: ++idRef.current,
          x: Math.random() * 96 + 2,
          size,
          duration,
          delay: 0,
          hue: 190 + Math.random() * 80, // blue → purple
          popped: false,
        };
        // auto-remove after its float animation finishes
        window.setTimeout(() => {
          setBubbles((curr) => curr.filter((x) => x.id !== b.id));
        }, (duration + 0.5) * 1000);
        return [...trimmed, b];
      });
    };
    const interval = window.setInterval(spawn, 350);
    // prime a few immediately
    for (let i = 0; i < 6; i++) spawn();
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const pop = (id: number) => {
    setBubbles((prev) => prev.map((b) => (b.id === id ? { ...b, popped: true } : b)));
    window.setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== id));
    }, 350);
  };

  const pct = Math.max(0, Math.min(100, value));

  return (
    <>
      {/* Full-screen bubble playground (does not block underlying scroll/clicks where empty) */}
      <div
        className="fixed inset-0 z-40 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        {bubbles.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => pop(b.id)}
            onTouchStart={() => pop(b.id)}
            className="lp-bubble pointer-events-auto absolute rounded-full focus:outline-none"
            style={{
              left: `${b.x}vw`,
              bottom: `-${b.size + 20}px`,
              width: `${b.size}px`,
              height: `${b.size}px`,
              animation: b.popped
                ? "lp-pop 320ms ease-out forwards"
                : `lp-rise ${b.duration}s linear forwards, lp-sway ${(b.duration / 2).toFixed(2)}s ease-in-out infinite alternate`,
              background: `radial-gradient(circle at 30% 30%, hsla(${b.hue}, 90%, 85%, 0.95), hsla(${b.hue}, 80%, 60%, 0.55) 60%, hsla(${b.hue}, 70%, 45%, 0.25) 100%)`,
              boxShadow: `inset -4px -6px 12px hsla(${b.hue}, 90%, 30%, 0.35), 0 4px 16px hsla(${b.hue}, 80%, 50%, 0.35)`,
              border: `1px solid hsla(${b.hue}, 90%, 90%, 0.6)`,
            }}
            aria-label="Pop bubble"
          />
        ))}
      </div>

      {/* Liquid fill container */}
      <div className="relative w-full rounded-2xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden shadow-elegant">
        <div className="relative h-40 w-full overflow-hidden">
          {/* Liquid */}
          <div
            className="lp-liquid absolute inset-x-0 bottom-0 transition-[height] duration-700 ease-out"
            style={{ height: `${pct}%` }}
          >
            <div className="lp-wave lp-wave-a" />
            <div className="lp-wave lp-wave-b" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/70 to-primary/40" />
          </div>

          {/* Inner bubbles inside the liquid */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => {
              const size = 6 + ((i * 7) % 14);
              const left = (i * 13 + 5) % 95;
              const dur = 3 + ((i * 1.3) % 3);
              const delay = (i * 0.4) % 3;
              return (
                <span
                  key={i}
                  className="absolute rounded-full bg-white/70"
                  style={{
                    left: `${left}%`,
                    bottom: `2%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    animation: `lp-inner-rise ${dur}s ease-in ${delay}s infinite`,
                    opacity: pct > 2 ? 0.8 : 0,
                  }}
                />
              );
            })}
          </div>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="text-3xl md:text-4xl font-bold tabular-nums drop-shadow-sm">
              {pct}%
            </div>
            {label && (
              <div className="text-sm font-medium mt-1 max-w-full truncate">{label}</div>
            )}
            {sublabel && (
              <div className="text-[11px] text-muted-foreground mt-0.5 max-w-full truncate">
                {sublabel}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-2">
        Tip: tap the floating bubbles to pop them while you wait ✨
      </p>
    </>
  );
}

import { useEffect, useRef } from "react";

interface ElectricAuraProps {
  /** Element to attach the aura to */
  targetRef: React.RefObject<HTMLElement>;
  color?: string;
  active?: boolean;
}

/**
 * Renders an animated electric / glowing aura around the target element.
 * Uses an absolutely-positioned canvas overlay.
 */
export function ElectricAura({
  targetRef,
  color = "#f97316",
  active = true,
}: ElectricAuraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const target = targetRef.current;
    if (!canvas || !target) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(cx, cy) - 4;

      // Outer glow
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius + 8);
      grad.addColorStop(0, color + "88");
      grad.addColorStop(1, color + "00");
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Electric arcs
      const arcCount = 6;
      for (let i = 0; i < arcCount; i++) {
        const angle = ((Math.PI * 2) / arcCount) * i + frame * 0.03;
        const jitter = Math.sin(frame * 0.2 + i * 1.3) * 4;
        const x1 = cx + Math.cos(angle) * (radius - 2 + jitter);
        const y1 = cy + Math.sin(angle) * (radius - 2 + jitter);
        const x2 = cx + Math.cos(angle + 0.5) * (radius + jitter + 6);
        const y2 = cy + Math.sin(angle + 0.5) * (radius + jitter + 6);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color + "cc";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      frame++;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, color, targetRef]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      width={140}
      height={140}
      style={{
        position: "absolute",
        inset: "-14px",
        pointerEvents: "none",
        zIndex: 10,
      }}
    />
  );
}

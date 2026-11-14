import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../lib/hooks";

type Star = { x: number; y: number; r: number; a: number; z: number; p: number };

/**
 * A restrained 2D-canvas starfield (not WebGL). ~100–200 stars, slow drift, and it
 * stops drawing entirely when the hero is off-screen or the tab is hidden.
 * With prefers-reduced-motion it renders a single static frame.
 */
export function Starfield({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let raf = 0;
    let visible = true;
    let last = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const seed = () => {
      const count = Math.round(Math.min(220, Math.max(70, (w * h) / 11000)));
      stars = Array.from({ length: count }, () => {
        const z = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          z,
          r: 0.4 + z * z * 1.1,
          a: 0.25 + z * 0.65,
          p: Math.random() * Math.PI * 2,
        };
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      draw(0);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = reduced ? 1 : 0.85 + 0.15 * Math.sin(t / 2200 + s.p);
        ctx.globalAlpha = s.a * tw;
        ctx.fillStyle = s.z > 0.85 ? "#f3e6d2" : "#f3f2ee";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const tick = (t: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      // ~30 fps is plenty for a slow drift and halves the cost on older GPUs
      if (t - last > 33) {
        const dt = Math.min(t - last, 100) / 1000;
        last = t;
        for (const s of stars) {
          s.x -= (2 + s.z * 7) * dt;
          if (s.x < -2) s.x = w + 2;
        }
        draw(t);
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (reduced || raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    });
    io.observe(canvas);
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else start();
    };
    document.addEventListener("visibilitychange", onVis);
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduced]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

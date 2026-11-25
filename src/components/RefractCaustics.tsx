"use client";

import { useEffect, useRef } from "react";

export function RefractCaustics({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rafId = 0;
    const w = 220;
    const h = 260;
    canvas.width = w;
    canvas.height = h;
    const img = ctx.createImageData(w, h);

    function drawFrame(timeSec: number) {
      const data = img.data;
      const t = timeSec * 0.55;

      for (let y = 0; y < h; y++) {
        const ny = y * 0.045;
        for (let x = 0; x < w; x++) {
          const nx = x * 0.045;
          const v1 = Math.sin(nx * 1.4 + t + Math.cos(ny * 1.2 - t * 0.7));
          const v2 = Math.sin(ny * 1.6 - t * 0.8 + Math.cos(nx * 1.1 + t * 0.6));
          const v3 = Math.sin((nx + ny) * 1.15 + t * 0.5);
          const ridge = 1 - Math.abs(v1 + v2 + v3 * 0.6) / 2.6;
          const caustic = Math.pow(Math.max(0, ridge), 4.2);

          const idx = (y * w + x) * 4;
          data[idx] = 248;
          data[idx + 1] = 253;
          data[idx + 2] = 255;
          data[idx + 3] = Math.min(220, Math.floor(caustic * 235));
        }
      }

      ctx!.putImageData(img, 0, 0);
    }

    if (prefersReduced) {
      drawFrame(1.4);
      return;
    }

    let last = 0;
    const loop = (now: number) => {
      if (now - last >= 55) {
        last = now;
        drawFrame(now / 1000);
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none h-full w-full opacity-85 mix-blend-screen ${className}`}
    />
  );
}

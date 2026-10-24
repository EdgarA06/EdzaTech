"use client";

import { useEffect, useRef } from "react";
import { emitRipple, prefersReducedMotion, type Ripple } from "./ripple-bus";

const BLUE = { r: 33, g: 114, b: 177 };
const PURPLE = { r: 230, g: 84, b: 234 };
const BASE = { r: 255, g: 255, b: 255 };
const GRID = 22;
const OFFSET = 11;
const DOT_R = 1.2;
const BASE_ALPHA = 0.12;
const LIFE = 2.2;
const SPEED = 380;
const BAND = 90;
const AMP = 16;
const BRIGHT = 0.55;
const MAX_RIPPLES = 6;

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function applyRipple(
  state: { x: number; y: number; alpha: number; accent: number; hue: number },
  ox: number,
  oy: number,
  ripple: { x: number; y: number; currentRadius: number; amplitude: number; brightness: number },
) {
  const dx = ox - ripple.x;
  const dy = oy - ripple.y;
  const dist = Math.hypot(dx, dy);
  const o = dist - ripple.currentRadius;
  if (Math.abs(o) >= BAND) return state;

  const lobe = Math.cos((o / BAND) * Math.PI * 0.5);
  const inv = dist > 0.001 ? 1 / dist : 0;
  const push = lobe * ripple.amplitude;
  const strength = Math.max(0, lobe);
  const angle = Math.atan2(dy, dx);
  const hue = (angle / Math.PI + 1) * 0.5;

  return {
    x: state.x + dx * inv * push,
    y: state.y + dy * inv * push,
    alpha: state.alpha + ripple.brightness * strength,
    accent: Math.min(1, state.accent + strength * 0.95),
    hue: state.accent > strength ? state.hue : hue,
  };
}

export function DotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let ripples: Ripple[] = [];
    let ticking = false;
    let raf = 0;
    const reduced = prefersReducedMotion();

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = `rgba(${BASE.r}, ${BASE.g}, ${BASE.b}, ${BASE_ALPHA})`;
      for (let y = OFFSET; y < height; y += GRID) {
        for (let x = OFFSET; x < width; x += GRID) {
          ctx.beginPath();
          ctx.arc(x, y, DOT_R, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!ticking) drawStatic();
    };

    const frame = () => {
      const now = performance.now() / 1000;
      ripples = ripples.filter((ripple) => now - ripple.startTime < LIFE);
      if (ripples.length === 0) {
        drawStatic();
        ticking = false;
        raf = 0;
        return;
      }

      const live = ripples.map((ripple) => {
        const age = now - ripple.startTime;
        const fade = 1 - age / LIFE;
        return {
          x: ripple.x,
          y: ripple.y,
          currentRadius: SPEED * age,
          amplitude: AMP * fade,
          brightness: BRIGHT * fade,
        };
      });

      ctx.clearRect(0, 0, width, height);
      for (let y = OFFSET; y < height; y += GRID) {
        for (let x = OFFSET; x < width; x += GRID) {
          let state = { x, y, alpha: BASE_ALPHA, accent: 0, hue: 0.5 };
          for (const ripple of live) state = applyRipple(state, x, y, ripple);

          const accent = Math.min(1, state.accent);
          const r = Math.round(mix(BASE.r, mix(BLUE.r, PURPLE.r, state.hue), accent));
          const g = Math.round(mix(BASE.g, mix(BLUE.g, PURPLE.g, state.hue), accent));
          const b = Math.round(mix(BASE.b, mix(BLUE.b, PURPLE.b, state.hue), accent));
          const alpha = Math.min(1, state.alpha + accent * 0.55);

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(state.x, state.y, DOT_R + accent * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(frame);
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.('a, button, [role="button"], input, textarea, select, label, [role="dialog"]')) {
        return;
      }
      if (ripples.length >= MAX_RIPPLES) ripples.shift();
      const ripple = {
        x: event.clientX,
        y: event.clientY,
        startTime: performance.now() / 1000,
      };
      ripples.push(ripple);
      emitRipple(ripple);
      start();
    };

    resize();
    if (!reduced) window.addEventListener("click", onClick);
    window.addEventListener("resize", resize);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("click", onClick);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Above the handshake plate, below copy/UI, so ripples are never clipped.
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[1]">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

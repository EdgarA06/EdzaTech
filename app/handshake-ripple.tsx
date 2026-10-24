"use client";

import { useEffect, useRef } from "react";
import { onRipple, prefersReducedMotion, type Ripple } from "./ripple-bus";

const LIFE = 2.2;
const SPEED = 380;
/** How quickly the hands ease toward the cursor (0–1). */
const HOVER_LERP = 0.07;
const HOVER_RANGE_X = 5;
const HOVER_RANGE_Y = 4;
const HOVER_TILT_X = 1.6;
const HOVER_TILT_Y = 2;

type Props = {
  src: string;
  className?: string;
};

export function HandshakeRipple({ src, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let ripples: Ripple[] = [];
    let raf = 0;
    let ticking = false;
    const reduced = prefersReducedMotion();

    const syncSize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const paint = () => {
      const now = performance.now() / 1000;
      ripples = ripples.filter((ripple) => now - ripple.startTime < LIFE);
      const rect = wrap.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      if (ripples.length === 0) {
        ticking = false;
        raf = 0;
        return;
      }

      for (const ripple of ripples) {
        const age = now - ripple.startTime;
        const fade = 1 - age / LIFE;
        const radius = SPEED * age;
        const lx = ripple.x - rect.left;
        const ly = ripple.y - rect.top;

        const grad = ctx.createRadialGradient(lx, ly, Math.max(0, radius - 70), lx, ly, radius + 40);
        grad.addColorStop(0, "rgba(33, 114, 177, 0)");
        grad.addColorStop(0.45, `rgba(33, 114, 177, ${0.28 * fade})`);
        grad.addColorStop(0.72, `rgba(107, 63, 212, ${0.34 * fade})`);
        grad.addColorStop(1, `rgba(230, 84, 234, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(lx, ly, radius + 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(230, 84, 234, ${0.55 * fade})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(lx, ly, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(33, 114, 177, ${0.42 * fade})`;
        ctx.beginPath();
        ctx.arc(lx, ly, Math.max(0, radius - 28), 0, Math.PI * 2);
        ctx.stroke();
      }

      raf = requestAnimationFrame(paint);
    };

    const start = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(paint);
    };

    const unsub = onRipple((ripple) => {
      if (reduced) return;
      ripples.push(ripple);
      if (ripples.length > 6) ripples.shift();
      start();
    });

    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(wrap);
    window.addEventListener("resize", syncSize);

    return () => {
      unsub();
      ro.disconnect();
      window.removeEventListener("resize", syncSize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Subtle cursor-linked tilt / drift while hovering the hands.
  useEffect(() => {
    const wrap = wrapRef.current;
    const motion = motionRef.current;
    if (!wrap || !motion) return;
    if (prefersReducedMotion()) return;

    const state = {
      active: false,
      nx: 0,
      ny: 0,
      x: 0,
      y: 0,
      rx: 0,
      ry: 0,
      running: false,
    };
    let raf = 0;

    const settled = () =>
      !state.active &&
      Math.abs(state.x) < 0.04 &&
      Math.abs(state.y) < 0.04 &&
      Math.abs(state.rx) < 0.015 &&
      Math.abs(state.ry) < 0.015;

    const paint = () => {
      const tx = state.active ? state.nx * HOVER_RANGE_X : 0;
      const ty = state.active ? state.ny * HOVER_RANGE_Y : 0;
      const trx = state.active ? -state.ny * HOVER_TILT_X : 0;
      const try_ = state.active ? state.nx * HOVER_TILT_Y : 0;

      state.x += (tx - state.x) * HOVER_LERP;
      state.y += (ty - state.y) * HOVER_LERP;
      state.rx += (trx - state.rx) * HOVER_LERP;
      state.ry += (try_ - state.ry) * HOVER_LERP;

      motion.style.transform = `perspective(1200px) translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0) rotateX(${state.rx.toFixed(2)}deg) rotateY(${state.ry.toFixed(2)}deg)`;

      if (settled()) {
        motion.style.transform = "";
        state.running = false;
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(paint);
    };

    const ensure = () => {
      if (state.running) return;
      state.running = true;
      raf = requestAnimationFrame(paint);
    };

    const onEnter = () => {
      state.active = true;
      ensure();
    };
    const onLeave = () => {
      state.active = false;
      state.nx = 0;
      state.ny = 0;
      ensure();
    };
    const onMove = (event: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      // Bias toward the denser hand mass (slightly right / upper-center).
      const cx = rect.left + rect.width * 0.58;
      const cy = rect.top + rect.height * 0.46;
      state.nx = Math.max(-1, Math.min(1, (event.clientX - cx) / (rect.width * 0.42)));
      state.ny = Math.max(-1, Math.min(1, (event.clientY - cy) / (rect.height * 0.42)));
      if (!state.active) state.active = true;
      ensure();
    };

    wrap.addEventListener("pointerenter", onEnter);
    wrap.addEventListener("pointerleave", onLeave);
    wrap.addEventListener("pointermove", onMove);

    return () => {
      wrap.removeEventListener("pointerenter", onEnter);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
      motion.style.transform = "";
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`edza-handshake-wrap ${className ?? "absolute inset-0"}`}
    >
      <div ref={motionRef} className="edza-handshake-motion absolute inset-0">
        {/* Soft blurred underlay so edges dissolve into the field */}
        <img
          src={src}
          alt=""
          aria-hidden
          className="edza-handshake pointer-events-none absolute inset-0 size-full max-w-none scale-[1.04] object-contain object-right opacity-70 blur-[18px]"
        />
        <img
          src={src}
          alt=""
          className="edza-handshake pointer-events-none absolute inset-0 size-full max-w-none object-contain object-right"
        />
      </div>
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 mix-blend-screen" />
    </div>
  );
}

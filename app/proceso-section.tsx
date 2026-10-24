/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    n: "01",
    label: "Entender",
    title: "entender",
    lead: "La mayoría de las páginas no venden porque nadie pensó a quién iban dirigidas.",
    points: [
      "No diseñamos nada sin antes haber entendido tu marca.",
      "Investigamos lo que busca tu cliente ideal.",
      "Damos un mensaje claro antes de mover un solo pixel.",
    ],
  },
  {
    n: "02",
    label: "Estructurar",
    title: "Estructurar",
    lead: "Una web bonita que confunde al usuario es solo un folleto caro.",
    points: [
      "Diseñamos la experiencia visual completa antes de programar.",
      "Arquitectura limpia para que encuentren lo que buscan en 3 segundos.",
      "No descansamos hasta que apruebes el estilo visual final.",
    ],
  },
  {
    n: "03",
    label: "Ejecutar",
    title: "Ejecutar",
    lead: "Si una página tarda más de 3 segundos en abrir, ya perdiste al cliente.",
    points: [
      "Código limpio y moderno, sin plantillas pesadas que ralenticen todo.",
      "Optimizada para verse y cargar correctamente.",
      "Bases sólidas, listas para escalar cuando tu negocio crezca.",
    ],
  },
  {
    n: "04",
    label: "Entregar",
    title: "Entregar",
    lead: "Cerrar un proyecto no es mandarte un link y desaparecer.",
    points: [
      "Conectamos tu dominio, configuramos tus accesos y hacemos pruebas reales.",
      "Lanzamos tu sitio listo para recibir clientes.",
      "Soporte directo y transparente, sin intermediarios ni lenguaje raro.",
    ],
  },
] as const;

type Step = (typeof STEPS)[number];

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function StepCopy({ step }: { step: Step }) {
  return (
    <div className="edza-proceso-copy">
      <h2 className="edza-section-title">{step.title}</h2>
      <p className="edza-proceso-lead edza-section-lead">{step.lead}</p>
      <div className="edza-proceso-points">
        {step.points.map((point) => (
          <p key={point} className="edza-proceso-point">
            - {point}
          </p>
        ))}
      </div>
    </div>
  );
}

/** Node centers in a 4-col grid, as fraction of the timeline width (0–1). */
const NODE_X = STEPS.map((_, i) => (i + 0.5) / STEPS.length);
const TRACK_LEFT = 0.08;

export function ProcesoSection() {
  const pinRef = useRef<HTMLElement>(null);
  const assembleRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [stepFloat, setStepFloat] = useState(0);
  const [stepLocal, setStepLocal] = useState(0);

  useEffect(() => {
    const pin = pinRef.current;
    if (!pin) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = pin.getBoundingClientRect();
      const total = Math.max(1, pin.offsetHeight - window.innerHeight);
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const p = scrolled / total;
      // 0 → start of 01, 1 → start of 02, … 3 → start of 04, 4 → end of 04
      const sf = p * STEPS.length;
      const idx = Math.min(STEPS.length - 1, Math.floor(sf + 1e-9));
      const local = Math.min(1, Math.max(0, sf - idx));
      setStepFloat(sf);
      setActive(idx);
      setStepLocal(local);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const node = assembleRef.current;
    if (!node) return;
    if (prefersReducedMotion()) {
      node.classList.add("edza-reveal--in");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        node.classList.add("edza-reveal--in");
        io.unobserve(node);
      },
      { threshold: 0.18 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  function goToStep(index: number) {
    const pin = pinRef.current;
    if (!pin) return;
    const total = Math.max(1, pin.offsetHeight - window.innerHeight);
    const origin = pin.getBoundingClientRect().top + window.scrollY;
    // Land near the start of the requested step so active + line tip match.
    const target = origin + (total * (index + 0.08)) / STEPS.length;
    window.scrollTo({ top: target, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  // Tip sits on the active node so dots and copy always match (CSS eases the move).
  const tipX = NODE_X[active];
  const lineWidthPct = Math.max(0, (tipX - TRACK_LEFT) * 100);

  // E fills across the whole journey; 100% only at the end of step 04 (not on 03).
  const letterFill = Math.min(1, Math.max(0, stepFloat / STEPS.length));

  // Strong per-step zoom (same feel as before); CSS media query handles reduced motion.
  const activeZoom = 1 + stepLocal * 0.2;
  const showScrollHint = active < STEPS.length - 1;

  return (
    <section
      id="proceso"
      ref={pinRef}
      className="relative z-10"
      style={{ height: `${STEPS.length * 100}vh` }}
      aria-label="Proceso en cuatro pasos"
    >
      <div className="edza-proceso-sticky relative sticky top-0 h-svh max-h-svh w-full">
        {/* Numeral — opacity crossfade, same vertical center as the E */}
        {STEPS.map((item, index) => (
          <span
            key={item.n}
            className={`edza-proceso-bg-num ${index === active ? "edza-proceso-bg-num--active" : ""}`}
            aria-hidden
          >
            {item.n}
          </span>
        ))}

        <div
          className="edza-proceso-e pointer-events-none absolute top-1/2 right-[2%] z-0 flex -translate-y-1/2 items-center justify-center sm:right-[4%] lg:right-[6%]"
          aria-hidden
        >
          <div className="relative h-[min(38vh,280px)] w-[min(34vh,240px)] sm:h-[min(42vh,300px)] sm:w-[min(38vh,260px)]">
            <img
              src="/figma/letra.png"
              alt=""
              className="absolute inset-0 size-full object-contain opacity-[0.26]"
              draggable={false}
            />
            <svg
              className="edza-proceso-e-fill absolute inset-0 size-full"
              viewBox="0 0 260 300"
              preserveAspectRatio="xMidYMid meet"
              style={{ ["--edza-e-fill" as string]: letterFill }}
            >
              <defs>
                <linearGradient id="edza-e-grad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#e654ea" />
                  <stop offset="22%" stopColor="#b44ae8" />
                  <stop offset="48%" stopColor="#6b3fd4" />
                  <stop offset="72%" stopColor="#3d6ec4" />
                  <stop offset="100%" stopColor="#2172b1" />
                </linearGradient>
                <mask id="edza-e-mask">
                  <image
                    href="/figma/letra.png"
                    x="0"
                    y="0"
                    width="260"
                    height="300"
                    preserveAspectRatio="xMidYMid meet"
                  />
                </mask>
              </defs>
              <rect
                className="edza-proceso-e-fill-rect"
                x="0"
                y="0"
                width="260"
                height="300"
                fill="url(#edza-e-grad)"
                mask="url(#edza-e-mask)"
              />
            </svg>
          </div>
        </div>

        {/* Under the E horizontally, aligned with the timeline line */}
        {showScrollHint ? (
          <button
            type="button"
            className="edza-scroll-hint"
            aria-label="Haz scroll para ver el siguiente paso"
            onClick={() => goToStep(Math.min(active + 1, STEPS.length - 1))}
          >
            <span className="edza-scroll-hint__mouse" aria-hidden>
              <span className="edza-scroll-hint__wheel" />
            </span>
            <span className="edza-scroll-hint__label">Scroll</span>
          </button>
        ) : null}

        <div className="relative z-10 flex h-full max-h-svh w-full flex-col overflow-hidden px-4 pt-[5.5rem] pb-14 sm:px-8 sm:pt-[6.25rem] sm:pb-16 lg:px-12 lg:pb-20">
          <div
            ref={assembleRef}
            className="edza-reveal edza-reveal--scale relative flex min-h-0 w-full flex-1 flex-col"
          >
            <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[1100px] flex-1 flex-col justify-center overflow-hidden pb-6 sm:pb-10">
              {/* Discrete carousel: snaps to the active step; zoom lives on the active slide */}
              <div className="edza-proceso-stage">
                <div
                  className="edza-proceso-carousel"
                  style={{ transform: `translate3d(${-active * 100}%, 0, 0)` }}
                >
                  {STEPS.map((step, index) => {
                    const isActive = index === active;
                    const zoom = isActive ? activeZoom : 1;
                    return (
                      <div
                        key={step.n}
                        className={`edza-proceso-slide${isActive ? " edza-proceso-slide--active" : ""}`}
                      >
                        <div
                          className="edza-proceso-zoom-track"
                          style={{ transform: `scale(${zoom})` }}
                        >
                          <div className="edza-proceso-panel">
                            <StepCopy step={step} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="edza-proceso-timeline relative z-10 mx-auto mb-2 w-full max-w-[782px] shrink-0 sm:mb-4">
            <div className="grid grid-cols-4 text-center">
              {STEPS.map((item, index) => {
                const current = index === active;
                return (
                  <button
                    key={item.n}
                    type="button"
                    onClick={() => goToStep(index)}
                    className="edza-hit"
                    aria-current={current ? "step" : undefined}
                    aria-label={`Ir al paso ${item.n}: ${item.label}`}
                  >
                    <span className={`edza-proceso-num ${current ? "edza-proceso-num--active" : ""}`}>{item.n}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative mt-2 grid h-6 grid-cols-4">
              <span aria-hidden className="absolute top-[10px] right-[8%] left-[8%] h-px bg-white/35" />
              <span aria-hidden className="absolute top-[14px] right-[8%] left-[8%] h-px bg-white/35" />
              <span
                aria-hidden
                className="edza-proceso-fill absolute top-[10px] left-[8%] h-px"
                style={{ width: `${lineWidthPct}%` }}
              />
              <span
                aria-hidden
                className="edza-proceso-fill absolute top-[14px] left-[8%] h-px opacity-80"
                style={{ width: `${lineWidthPct}%` }}
              />
              {STEPS.map((item, index) => {
                const on = index <= active;
                const current = index === active;
                return (
                  <button
                    key={item.n}
                    type="button"
                    onClick={() => goToStep(index)}
                    className="relative z-10 flex items-center justify-center"
                    aria-label={`Paso ${item.n}`}
                  >
                    <img
                      src="/figma/ellipse-1.svg"
                      alt=""
                      width={24}
                      height={24}
                      className={`absolute size-6 max-w-none transition-opacity duration-500 ease-[cubic-bezier(0.51,0.01,0.2,1)] ${current ? "opacity-100" : "opacity-40"}`}
                    />
                    <img
                      src={on ? "/figma/ellipse-5.svg" : "/figma/ellipse-6.svg"}
                      alt=""
                      width={14}
                      height={14}
                      className={`relative size-3.5 max-w-none transition-[transform,filter] duration-500 ease-[cubic-bezier(0.51,0.01,0.2,1)] ${
                        current ? "scale-110 drop-shadow-[0_0_10px_rgba(230,84,234,0.75)]" : "scale-100"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-4 text-center">
              {STEPS.map((item, index) => {
                const current = index === active;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => goToStep(index)}
                    className={`edza-hit text-[12px] font-light tracking-[-0.75px] transition-colors duration-500 ease-[cubic-bezier(0.51,0.01,0.2,1)] sm:text-[15px] ${
                      current ? "font-medium text-[#e654ea]" : "text-white/45"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

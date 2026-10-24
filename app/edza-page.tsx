/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { DotField } from "./dot-field";
import { HandshakeRipple } from "./handshake-ripple";
import { ProcesoSection } from "./proceso-section";
import { Reveal } from "./reveal";

type SectionId = "inicio" | "proceso" | "proyectos" | "contacto" | "footer";
type OverlayId = "terms" | "privacy" | "about";

const SHADOW_BLUE = "0px 3px 4.5px 0px #2172b1";
const SHADOW_PURPLE = "0px 3px 4.5px 0px #9747ff";
const SHADOW_PINK = "0px 4px 4px 0px #e654ea";

const PROJECTS = [
  {
    title: "Plataforma Educativa",
    bar: "rgba(88,134,221,0.8)",
    lines: [
      "Rediseño completo de interfaz y",
      "desarrollo enfocado en la",
      "experiencia de usuario para",
      "un colegio.",
    ],
  },
  {
    title: "Fesa Facturación",
    bar: "rgba(92,168,103,0.8)",
    lines: ["Landing page moderna con un", "diseño intuitivo, enfocado en", "la facturación en línea."],
  },
  {
    title: "Fotolitográfica",
    bar: "rgba(224,185,55,0.8)",
    lines: [
      "Diseño web interactivo enfocado en la venta de cajas con un sistema de configuración 3D en tiempo real.",
    ],
  },
] as const;

let navScrollClearTimer = 0;

/** Pause Proceso step animations while nav scrolls so sticky scrubbing does not thrash. */
function beginNavScroll(ms = 1400) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.edzaNavScroll = "1";
  window.clearTimeout(navScrollClearTimer);
  const clear = () => {
    delete root.dataset.edzaNavScroll;
    window.removeEventListener("scrollend", clear);
  };
  window.addEventListener("scrollend", clear, { once: true });
  navScrollClearTimer = window.setTimeout(clear, ms);
}

function scrollToInicio() {
  beginNavScroll(900);
  const proceso = document.getElementById("proceso");
  const procesoTop = proceso ? proceso.getBoundingClientRect().top + window.scrollY : 0;
  const y = window.scrollY;

  // From below the sticky pin, jump above Proceso first so smooth scroll
  // does not scrub every step (that feels locked / choppy).
  if (y > procesoTop + 40) {
    window.scrollTo({ top: Math.max(0, procesoTop - 4), behavior: "auto" });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
    return;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToSection(id: SectionId) {
  if (id === "inicio") {
    scrollToInicio();
    return;
  }

  beginNavScroll();
  const node = document.getElementById(id);
  if (!node) return;
  // Proceso is a pinned sticky frame: align its top to the viewport so the full step + timeline show.
  if (id === "proceso") {
    const top = node.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: "smooth" });
    return;
  }
  // Match .edza-section scroll-margin / Proceso sticky top clearance
  const offset = window.matchMedia("(min-width: 640px)").matches ? 100 : 88;
  const top = node.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

function TechMark({ kind }: { kind: "figma" | "angular" | "javascript" }) {
  if (kind === "javascript") {
    return (
      <span className="relative block h-8 w-7 overflow-hidden" aria-hidden>
        <span className="absolute aspect-square" style={{ left: "-20.51%", right: "-23.08%", top: -4 }}>
          <img src="/figma/javascript.png" alt="" className="absolute inset-0 size-full object-cover" />
        </span>
      </span>
    );
  }
  if (kind === "angular") {
    return <img src="/figma/angular.svg" alt="" width={38} height={41} className="h-8 w-7 max-w-none" />;
  }
  return <img src="/figma/figma.svg" alt="" width={31} height={47} className="h-9 w-6 max-w-none" />;
}

function ActionButton({
  label,
  className,
  shadow,
  onClick,
  type = "button",
}: {
  label: string;
  className?: string;
  shadow: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      data-text={label}
      className={`edza-btn px-4 py-2 text-[15px] font-normal tracking-[1.4px] sm:px-5 sm:py-2.5 sm:text-[18px] ${className ?? ""}`}
      style={{ ["--edza-btn-shadow" as string]: shadow }}
    >
      <span>{label}</span>
    </button>
  );
}

function NavLink({
  label,
  onClick,
  accent = false,
  className,
}: {
  label: string;
  onClick: () => void;
  accent?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-text={label}
      className={`edza-nav-link ${accent ? "edza-nav-link--accent" : ""} ${className ?? ""}`}
    >
      <span>{label}</span>
    </button>
  );
}

/** Emotion-style staggered letter hover — one stack per character, no bounce. */
function LetterLink({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick?: () => void;
  className?: string;
}) {
  const chars = Array.from(label);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`edza-letter-link ${className ?? ""}`}
      aria-label={label}
    >
      <span className="edza-letter-link__row" aria-hidden="true">
        {chars.map((ch, i) => (
          <span
            key={`${label}-${i}`}
            className="edza-letter-link__char"
            style={{ ["--i" as string]: i }}
          >
            <span className="edza-letter-link__stack">
              <span className="edza-letter-link__glyph">{ch === " " ? "\u00A0" : ch}</span>
              <span className="edza-letter-link__glyph">{ch === " " ? "\u00A0" : ch}</span>
            </span>
          </span>
        ))}
      </span>
    </button>
  );
}

const LEGAL: Record<"terms" | "privacy", { title: string; body: string[] }> = {
  terms: {
    title: "Términos y Condiciones",
    body: [
      "EdZa tech diseña y desarrolla sitios web. Escribirnos no crea un contrato: alcance, plazos y costo se acuerdan por escrito antes de empezar.",
      "Lo que entregamos —diseño y código— se usa según lo firmado en cada proyecto. Hasta entonces, el material del sitio sigue siendo de EdZa tech.",
      "El formulario es para contarnos tu proyecto. No publiques datos de terceros ni información que no quieras compartir.",
    ],
  },
  privacy: {
    title: "Aviso de privacidad",
    body: [
      "Cuando nos escribes guardamos tu nombre, tu correo y el mensaje, solo para responderte.",
      "No vendemos esa información ni la usamos para otra cosa. La conservamos el tiempo que haga falta para dar seguimiento a tu solicitud.",
      "Si quieres corregir o borrar tus datos, responde al mismo correo con el que te contactamos y lo hacemos.",
    ],
  },
};

const ABOUT = {
  title: "Acerca de",
  lead: "Somos EdZa tech: un equipo pequeño que diseña y desarrolla sitios con intención comercial, no plantillas decorativas.",
  body: "Trabajamos directo contigo —sin intermediarios ni jerga innecesaria— para pasar de una idea clara a una interfaz que carga bien, se entiende rápido y ayuda a cerrar clientes.",
  points: [
    "Enfoque en mensaje, estructura y conversión.",
    "Diseño y código en el mismo proceso.",
    "Entrega transparente, soporte cercano.",
  ],
} as const;

const NAV: { id: SectionId; label: string }[] = [
  { id: "inicio", label: "Inicio" },
  { id: "proceso", label: "Proceso" },
  { id: "proyectos", label: "Proyectos" },
];

const ROTATING_WORDS = ["Mensaje", "Correo", "Whatsapp", "Proyecto"] as const;

const SOCIALS = [
  {
    label: "Gmail",
    mask: "/figma/gmail.svg",
    color: "/figma/gmail.svg",
    className: "h-[33px] w-[42px]",
  },
  {
    label: "WhatsApp",
    mask: "/figma/whatsapp.svg",
    color: "/figma/whatsapp.svg",
    className: "size-[41px]",
  },
  {
    label: "Instagram",
    mask: "/figma/instagram-mask.svg",
    color: "/figma/instagram.svg",
    className: "h-[39px] w-[40px]",
  },
  {
    label: "Facebook",
    mask: "/figma/facebook-mask.svg",
    color: "#1877F2",
    className: "size-[39px]",
    colorIsSolid: true,
  },
] as const;

function RotatingWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % ROTATING_WORDS.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, []);

  const word = ROTATING_WORDS[index];

  return (
    <span className="edza-rotate-slot" aria-live="polite">
      <span className="edza-rotate-sizer" aria-hidden="true">
        Whatsapp
      </span>
      <span key={word} className="edza-rotate-word">
        {word}
      </span>
    </span>
  );
}

export function EdZaPage() {
  const [langOpen, setLangOpen] = useState(false);
  const [overlay, setOverlay] = useState<OverlayId | null>(null);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [sent, setSent] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    const close = (event: MouseEvent) => {
      if (!langRef.current?.contains(event.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [langOpen]);

  useEffect(() => {
    if (!overlay) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOverlay(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay]);

  function go(id: SectionId) {
    setLangOpen(false);
    scrollToSection(id);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
    const ok = nombre.trim().length > 0 && emailOk && descripcion.trim().length > 0;
    setInvalid(!ok);
    setSent(ok);
    if (ok) {
      setNombre("");
      setCorreo("");
      setDescripcion("");
    }
    statusRef.current?.focus();
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());

  return (
    <>
      <DotField />
      <header className="sticky top-0 z-40 w-full overflow-hidden bg-black pt-6 pb-1 sm:pt-8 lg:pt-9">
        <div
          className={`edza-header-bar mx-6 flex items-center gap-3 border-y border-white/30 bg-black px-4 py-3 sm:mx-10 sm:gap-8 sm:px-5 lg:mx-12 lg:gap-12 lg:px-6 lg:py-0 xl:mx-14 ${scrolled ? "edza-header-bar--scrolled" : ""}`}
        >
          <button
            type="button"
            onClick={() => go("inicio")}
            aria-label="EdZa tech, ir al inicio"
            className="edza-hit relative h-9 w-[84px] shrink-0 border-0 bg-transparent p-0 sm:h-[50px] sm:w-[118px]"
          >
            <img src="/figma/logo.png" alt="" className="absolute inset-0 size-full object-cover" />
          </button>
          <nav className="flex min-w-0 flex-1 items-center justify-center gap-4 text-[13px] leading-[normal] font-light tracking-[-0.9px] text-white sm:gap-10 sm:text-[16px] lg:gap-16 lg:py-[25px] lg:text-[18px] xl:gap-24">
            {NAV.map((item) => (
              <NavLink key={item.id} label={item.label} onClick={() => go(item.id)} />
            ))}
          </nav>
          <NavLink
            label="Contacto"
            onClick={() => go("contacto")}
            accent
            className="shrink-0 text-[17px] sm:text-[22px] lg:text-[24px]"
          />
        </div>
      </header>

      <main className="relative">
        <section
          id="inicio"
          className="relative flex min-h-[calc(100svh-7rem)] w-full items-center overflow-hidden py-16 sm:py-20 lg:py-24"
        >
          <HandshakeRipple
            src="/figma/handshake.png?v=3"
            className="absolute right-[-18%] bottom-[-8%] z-0 h-[58%] w-[120%] max-w-none sm:top-[-4%] sm:right-[-8%] sm:bottom-auto sm:h-[108%] sm:w-[72%] lg:right-[-4%] lg:w-[68%]"
          />
          <div className="relative z-10 flex w-full flex-col px-6 sm:w-[min(100%,50vw)] sm:max-w-none sm:px-0 sm:pl-10 lg:pl-12 xl:pl-14">
            <h1 className="w-full text-[clamp(54px,7.8vw,108px)] leading-[1.02] font-normal tracking-[-0.05em] text-white uppercase">
              <span className="block">Hacemos</span>
              <span className="block">Realidad tu</span>
              <span className="block">Sitio web</span>
            </h1>
            <p className="mt-12 w-full max-w-[36em] text-[clamp(16px,1.5vw,22px)] leading-[1.5] font-light tracking-[-1.1px] text-white sm:mt-14">
              Diseñamos y creamos páginas web que no solo se ven bien, atraen clientes y venden.
            </p>
            <div className="mt-14 flex flex-wrap gap-5 sm:mt-16 sm:gap-6">
              <ActionButton label="Contáctanos" shadow={SHADOW_BLUE} onClick={() => go("contacto")} />
              <ActionButton label="Proyectos" shadow={SHADOW_PURPLE} onClick={() => go("proyectos")} />
            </div>
          </div>
        </section>

        <ProcesoSection />

        <section id="proyectos" className="edza-section relative z-10 w-full px-4 sm:px-8 lg:px-12">
          <Reveal as="h2" variant="scale" wipe className="edza-section-title">
            Proyectos
          </Reveal>
          <Reveal wipe className="edza-section-lead mx-auto max-w-[882px]" delay={110}>
            <p>Menos discursos más hechos.</p>
            <p>Una muestra de ideas que transformamos en interfaces reales.</p>
          </Reveal>
          <div className="mx-auto mt-10 grid w-full max-w-[1320px] gap-7 md:grid-cols-3 md:items-stretch sm:mt-12 lg:gap-9">
            {PROJECTS.map((project, index) => {
              const variants = ["left", "up", "right"] as const;
              return (
                <Reveal
                  key={project.title}
                  as="article"
                  variant={variants[index]}
                  delay={160 + index * 140}
                  className="edza-project-card h-full"
                  style={{ ["--edza-card-glow" as string]: project.bar }}
                >
                  <h3
                    className="edza-project-card__title px-4 py-2.5 text-center text-[clamp(18px,2vw,25px)] leading-[1.5] font-normal tracking-[1.4px] sm:tracking-[2.25px]"
                    style={{ background: project.bar }}
                  >
                    {project.title}
                  </h3>
                  <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center text-[clamp(16px,1.5vw,22px)] leading-[normal] font-light tracking-[-1.1px]">
                    {project.lines.map((line) => (
                      <p key={line} className="max-w-[34ch]">
                        {line}
                      </p>
                    ))}
                  </div>
                  <div className="edza-project-card__tech flex items-center justify-center gap-8 px-6 pb-8">
                    <TechMark kind="figma" />
                    <TechMark kind="angular" />
                    <TechMark kind="javascript" />
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section id="contacto" className="edza-section relative z-10 w-full px-4 sm:px-8 lg:px-12">
          <div className="mx-auto grid w-full max-w-[1320px] items-stretch gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,735px)] lg:gap-16 xl:gap-20">
            <Reveal variant="left" delay={80} className="edza-contacto-copy min-w-0 h-full">
              <div className="edza-contacto-copy__main">
                <h2 className="edza-section-title edza-section-title--left">Contacto</h2>
                <p className="edza-rotate-line mt-6 sm:mt-8">
                  <span className="edza-rotate-prefix">Mándanos un</span>
                  <RotatingWord />
                </p>
                <p className="mt-6 max-w-[570px] text-[clamp(14px,1.35vw,20px)] leading-[normal] font-light tracking-[-1.1px] sm:mt-8 sm:tracking-[0.02em]">
                  Hablemos sin rodeos, cuéntanos que traes en mente o el problema de tu sitio web actual.
                </p>
                <p className="mt-6 max-w-[616px] text-[clamp(14px,1.35vw,20px)] leading-[normal] font-light tracking-[-1.1px] sm:mt-8">
                  Contáctanos y te ayudamos sin compromiso y sin cotizaciones externas.
                </p>
              </div>
              <div className="edza-contacto-copy__socials flex items-center gap-8">
                {SOCIALS.map((social) => {
                  const colorIsSolid = "colorIsSolid" in social && social.colorIsSolid;
                  return (
                    <button
                      key={social.label}
                      type="button"
                      aria-label={social.label}
                      onClick={() => go("contacto")}
                      className={`edza-social ${social.className}`}
                      style={
                        {
                          ["--edza-social-mask" as string]: `url("${social.mask}")`,
                          ["--edza-social-color" as string]: colorIsSolid ? "none" : `url("${social.color}")`,
                          ...(colorIsSolid ? { ["--edza-social-solid" as string]: social.color } : {}),
                        } as CSSProperties
                      }
                    >
                      <span className="edza-social__layer edza-social__mono" aria-hidden />
                      <span
                        className={`edza-social__layer edza-social__color${colorIsSolid ? " edza-social__color--solid" : ""}`}
                        aria-hidden
                      />
                    </button>
                  );
                })}
              </div>
            </Reveal>

            <Reveal variant="right" delay={160} className="flex h-full w-full min-w-0 items-stretch">
              <form onSubmit={onSubmit} noValidate className="edza-contact-form">
                <input
                  className="edza-field"
                  name="nombre"
                  autoComplete="name"
                  placeholder="Nombre"
                  value={nombre}
                  aria-invalid={invalid && nombre.trim().length === 0}
                  onChange={(event) => {
                    setNombre(event.target.value);
                    setSent(false);
                  }}
                />
                <input
                  className="edza-field"
                  name="correo"
                  type="email"
                  autoComplete="email"
                  placeholder="Correo electrónico"
                  value={correo}
                  aria-invalid={invalid && !emailOk}
                  onChange={(event) => {
                    setCorreo(event.target.value);
                    setSent(false);
                  }}
                />
                <div className={`edza-field-wrap${descripcion.length > 0 ? " is-filled" : ""}`}>
                  <textarea
                    className="edza-field"
                    name="descripcion"
                    placeholder=" "
                    value={descripcion}
                    aria-label="Descripción"
                    aria-invalid={invalid && descripcion.trim().length === 0}
                    onChange={(event) => {
                      setDescripcion(event.target.value);
                      setSent(false);
                    }}
                  />
                  <span className="edza-field-fake">Descripción</span>
                </div>
                <ActionButton
                  type="submit"
                  label={sent ? "Enviado" : "Enviar"}
                  shadow={SHADOW_PURPLE}
                  className="min-w-[148px]"
                />
                <p ref={statusRef} tabIndex={-1} role="status" className="edza-sr">
                  {sent
                    ? "Mensaje listo. Te contactamos pronto."
                    : invalid
                      ? "Revisa el nombre, el correo y la descripción."
                      : ""}
                </p>
              </form>
            </Reveal>
          </div>
        </section>

      </main>

      <footer id="footer" className="edza-footer relative z-10 scroll-mt-24 w-full">
        <Reveal as="div" variant="up" delay={80} className="edza-footer__surface">
          <div className="edza-footer__glow" aria-hidden />
          <div className="edza-footer__inner">
            <div className="edza-footer__brand-row">
              <button
                type="button"
                className="edza-footer__brand edza-hit"
                onClick={() => go("inicio")}
                aria-label="EdZa tech, ir al inicio"
              >
                <img src="/figma/logo.png" alt="" className="edza-footer__logo" />
              </button>
            </div>

            <div className="edza-footer__right">
              <nav className="edza-footer__nav" aria-label="Pie de página">
                <LetterLink label="Inicio" onClick={() => go("inicio")} />
                <LetterLink label="Proceso" onClick={() => go("proceso")} />
                <LetterLink label="Proyectos" onClick={() => go("proyectos")} />
                <LetterLink label="Acerca de" onClick={() => setOverlay("about")} />
              </nav>

              <div className="edza-footer__actions">
                <button
                  type="button"
                  data-text="Otros servicios"
                  className="edza-btn px-5 py-2.5 text-[17px] sm:px-6 sm:py-3 sm:text-[19px]"
                  style={{ ["--edza-btn-shadow" as string]: SHADOW_BLUE }}
                  onClick={() => go("contacto")}
                >
                  <span>Otros servicios</span>
                </button>
                <div ref={langRef} className="edza-footer__lang relative">
                  <button
                    type="button"
                    aria-expanded={langOpen}
                    aria-haspopup="listbox"
                    onClick={() => setLangOpen((open) => !open)}
                    data-text="Idioma"
                    className="edza-btn edza-lang-btn px-5 py-2.5 text-[17px] sm:px-6 sm:py-3 sm:text-[19px]"
                    style={{ ["--edza-btn-shadow" as string]: SHADOW_PINK }}
                  >
                    <span>Idioma</span>
                    <img src="/figma/icon.svg" alt="" width={18} height={18} className="edza-lang-btn__icon" />
                  </button>
                  {langOpen && (
                    <ul role="listbox" aria-label="Idioma" className="edza-lang-menu">
                      <li role="option" aria-selected="true">
                        <button
                          type="button"
                          className="edza-hit border-0 bg-transparent p-0"
                          onClick={() => setLangOpen(false)}
                        >
                          Español
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="edza-footer__rule" aria-hidden />

            <div className="edza-footer__legal">
              <p>EdZa tech 2026</p>
              <div className="edza-footer__legal-links">
                <button type="button" className="edza-footer__legal-link" onClick={() => setOverlay("terms")}>
                  Términos y Condiciones
                </button>
                <span className="edza-footer__dot" aria-hidden>
                  ·
                </span>
                <button type="button" className="edza-footer__legal-link" onClick={() => setOverlay("privacy")}>
                  aviso de privacidad
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </footer>

      {overlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOverlay(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="overlay-title"
            className={`edza-overlay ${overlay === "about" ? "edza-overlay--about" : ""} w-full border border-solid border-white bg-black px-6 py-10 text-white sm:px-10 sm:py-12`}
          >
            <h2
              id="overlay-title"
              className="text-[clamp(22px,3vw,28px)] leading-[normal] font-normal tracking-[1.5px] capitalize"
            >
              {overlay === "about" ? ABOUT.title : LEGAL[overlay].title}
            </h2>

            {overlay === "about" ? (
              <div className="edza-acerca edza-acerca--overlay mt-8">
                <div className="edza-acerca__copy">
                  <p className="edza-acerca__lead">{ABOUT.lead}</p>
                  <p className="edza-acerca__body">{ABOUT.body}</p>
                </div>
                <div className="edza-acerca__points">
                  {ABOUT.points.map((point, index) => (
                    <p key={point}>
                      <span className="edza-acerca__mark">0{index + 1}</span>
                      {point}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-8 flex flex-col gap-5 text-[16px] leading-[1.5] font-light tracking-[-0.4px] sm:text-[18px]">
                {LEGAL[overlay].body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            )}

            <button
              ref={closeRef}
              type="button"
              onClick={() => setOverlay(null)}
              data-text="Cerrar"
              className="edza-btn mt-10 px-[20px] py-[15px] text-[22px] font-normal sm:text-[25px]"
              style={{ ["--edza-btn-shadow" as string]: SHADOW_PURPLE }}
            >
              <span>Cerrar</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

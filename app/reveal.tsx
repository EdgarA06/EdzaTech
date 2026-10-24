"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type RevealAs = "div" | "section" | "article" | "h2" | "p" | "header" | "footer";
type RevealVariant = "up" | "scale" | "left" | "right";

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
  variant = "up",
  wipe = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: RevealAs;
  variant?: RevealVariant;
  wipe?: boolean;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.classList.add("edza-reveal--in");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add("edza-reveal--in");
        io.unobserve(el);
      },
      { threshold: 0.12, rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const mergedStyle = {
    ...style,
    ...(delay ? { ["--edza-reveal-delay" as string]: `${delay}ms` } : {}),
  } as CSSProperties;

  return (
    <Tag
      ref={ref as never}
      className={`edza-reveal edza-reveal--${variant}${wipe ? " edza-reveal--wipe" : ""} ${className ?? ""}`}
      style={mergedStyle}
    >
      {children}
    </Tag>
  );
}

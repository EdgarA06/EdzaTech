export type Ripple = {
  x: number;
  y: number;
  startTime: number;
};

type Listener = (ripple: Ripple) => void;

const listeners = new Set<Listener>();

export function emitRipple(ripple: Ripple) {
  listeners.forEach((listener) => listener(ripple));
}

export function onRipple(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

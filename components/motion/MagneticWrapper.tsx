"use client";

/**
 * MagneticWrapper — Pattern C.2 (spring-driven magnetic pull for CTAs).
 * Source of truth: .claude/skills/motion-library/SKILL.md
 *
 * Pulls its content toward the cursor by a fraction of the cursor→centre
 * distance, radially clamped to `maxPull`, and springs back to exact centre on
 * leave. Spring { stiffness 150, damping 15, mass 0.1 } is OVERDAMPED
 * (ζ = 15 / (2·√(150·0.1)) ≈ 1.94 > 1), so it settles without overshoot —
 * consistent with the library's no-bounce rule.
 *
 * hitArea:
 *   "self"   — the wrapper is the hit area and is what moves (floating CTAs).
 *              Its rect includes the live translation, so the current spring
 *              offset is subtracted to recover the true resting centre.
 *   "parent" — listen on and measure the PARENT (e.g. a rigid grid button) but
 *              translate only this wrapper: the box stays still, the label floats.
 *
 * Zero React state on mouse move: only motion values change.
 */

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

export const MAGNETIC_SPRING = { stiffness: 150, damping: 15, mass: 0.1 } as const;
export const MAGNETIC_MAX_PULL = 15;
export const MAGNETIC_STRENGTH = 0.35;

export interface MagneticWrapperProps {
  children: ReactNode;
  /** Max pull radius in px (radial clamp). */
  maxPull?: number;
  /** Fraction of the cursor→centre distance applied before clamping. */
  strength?: number;
  hitArea?: "self" | "parent";
  className?: string;
}

export function MagneticWrapper({
  children,
  maxPull = MAGNETIC_MAX_PULL,
  strength = MAGNETIC_STRENGTH,
  hitArea = "self",
  className,
}: MagneticWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, MAGNETIC_SPRING);
  const sy = useSpring(y, MAGNETIC_SPRING);

  useEffect(() => {
    const el = ref.current;
    const target = hitArea === "parent" ? el?.parentElement : el;
    if (!el || !target) return;

    const coarse = window.matchMedia("(pointer: coarse)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const reset = () => {
      x.set(0);
      y.set(0);
    };

    const onMove = (e: MouseEvent) => {
      if (coarse.matches || reduced.matches) return;
      if (target instanceof HTMLButtonElement && target.disabled) return reset();
      const r = target.getBoundingClientRect();
      // "self": the measured box is the moving one — remove the live offset.
      const ox = hitArea === "self" ? sx.get() : 0;
      const oy = hitArea === "self" ? sy.get() : 0;
      let dx = (e.clientX - (r.left - ox + r.width / 2)) * strength;
      let dy = (e.clientY - (r.top - oy + r.height / 2)) * strength;
      const mag = Math.hypot(dx, dy);
      if (mag > maxPull) {
        const k = maxPull / mag;
        dx *= k;
        dy *= k;
      }
      x.set(dx);
      y.set(dy);
    };

    target.addEventListener("mousemove", onMove);
    target.addEventListener("mouseleave", reset);
    return () => {
      target.removeEventListener("mousemove", onMove);
      target.removeEventListener("mouseleave", reset);
    };
  }, [hitArea, maxPull, strength, x, y, sx, sy]);

  return (
    <motion.div ref={ref} data-magnetic={hitArea} className={className} style={{ x: sx, y: sy }}>
      {children}
    </motion.div>
  );
}

export default MagneticWrapper;

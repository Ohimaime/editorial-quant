"use client";

/**
 * MagneticTelemetryCell — Interaction Pattern C
 * Source of truth: .claude/skills/motion-library/SKILL.md
 *
 * The cell container (and its 1px hairlines) never moves. Only the inner
 * numeric payload is pulled toward the cursor, clamped to ±4px X / ±2.5px Y:
 *
 *   Tx = clamp((clientX − centerX) / (width / 2)  × 4,   −4,   4)
 *   Ty = clamp((clientY − centerY) / (height / 2) × 2.5, −2.5, 2.5)
 *
 * Motion is GSAP `quickTo` (0.18s power3.out) — no springs, no React state.
 * On leave the follow tweens pause and a 0.25s expo.out return runs; the next
 * move kills the return and resumes the follow from the payload's live x/y.
 */

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";

export const MAGNET_MAX_X = 4;
export const MAGNET_MAX_Y = 2.5;
export const MAGNET_FOLLOW = { duration: 0.18, ease: "power3.out" } as const;
export const MAGNET_RETURN = { duration: 0.25, ease: "expo.out" } as const;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Pure mapping from pointer position to clamped payload translation. */
export function magneticOffset(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
) {
  const dx = clientX - (rect.left + rect.width / 2);
  const dy = clientY - (rect.top + rect.height / 2);
  return {
    x: clamp((dx / (rect.width / 2)) * MAGNET_MAX_X, -MAGNET_MAX_X, MAGNET_MAX_X),
    y: clamp((dy / (rect.height / 2)) * MAGNET_MAX_Y, -MAGNET_MAX_Y, MAGNET_MAX_Y),
  };
}

type QuickTo = ReturnType<typeof gsap.quickTo>;

export interface MagneticHandlers<C extends HTMLElement> {
  onPointerMove: (e: ReactPointerEvent<C>) => void;
  onPointerLeave: (e: ReactPointerEvent<C>) => void;
}

/**
 * Wire magnetic pull into any container/payload pair.
 * `containerRef` is measured (never transformed); `payloadRef` is translated.
 */
export function useMagneticPull<C extends HTMLElement, P extends HTMLElement>(
  containerRef: RefObject<C | null>,
  payloadRef: RefObject<P | null>,
): MagneticHandlers<C> {
  const xTo = useRef<QuickTo | null>(null);
  const yTo = useRef<QuickTo | null>(null);
  const returnTween = useRef<gsap.core.Tween | null>(null);
  const enabled = useRef(true);

  // quickTo tweens are created inside the gsap.context and reverted on unmount.
  useGSAP(
    () => {
      const payload = payloadRef.current;
      if (!payload) return;
      xTo.current = gsap.quickTo(payload, "x", MAGNET_FOLLOW);
      yTo.current = gsap.quickTo(payload, "y", MAGNET_FOLLOW);
      enabled.current = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    },
    { scope: containerRef },
  );

  const onPointerMove = (e: ReactPointerEvent<C>) => {
    const payload = payloadRef.current;
    if (!enabled.current || e.pointerType === "touch" || !payload || !xTo.current || !yTo.current) {
      return;
    }
    // One rect read per move on a single element: always correct even if the
    // page scrolled under a stationary pointer. The container never transforms,
    // so this read never forces layout of animated content.
    const { x, y } = magneticOffset(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());

    if (returnTween.current) {
      returnTween.current.kill();
      returnTween.current = null;
      xTo.current(x, Number(gsap.getProperty(payload, "x")));
      yTo.current(y, Number(gsap.getProperty(payload, "y")));
      return;
    }
    xTo.current(x);
    yTo.current(y);
  };

  const onPointerLeave = () => {
    const payload = payloadRef.current;
    if (!payload) return;
    xTo.current?.tween.pause();
    yTo.current?.tween.pause();
    returnTween.current?.kill();
    returnTween.current = gsap.to(payload, { x: 0, y: 0, ...MAGNET_RETURN, overwrite: false });
  };

  // The return tween is created outside the context (in an event), so kill it explicitly.
  useEffect(() => () => void returnTween.current?.kill(), []);

  return { onPointerMove, onPointerLeave };
}

/**
 * Drop-in component form: a stationary, overflow-clipped button whose inner
 * payload is magnetic. For controls that need their own refs (e.g. an extra
 * animated layer), call `useMagneticPull` directly with your own container/payload refs.
 */
export function MagneticTelemetryCell({
  children,
  className = "",
  payloadClassName = "",
  ...rest
}: ComponentPropsWithoutRef<"button"> & { payloadClassName?: string; children: ReactNode }) {
  const cellRef = useRef<HTMLButtonElement>(null);
  const payloadRef = useRef<HTMLSpanElement>(null);
  const magnet = useMagneticPull(cellRef, payloadRef);

  return (
    <button ref={cellRef} type="button" {...rest} {...magnet} className={`relative overflow-hidden ${className}`}>
      <span ref={payloadRef} className={`relative inline-flex will-change-transform ${payloadClassName}`}>
        {children}
      </span>
    </button>
  );
}

export default MagneticTelemetryCell;

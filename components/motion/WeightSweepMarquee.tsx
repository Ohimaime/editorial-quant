"use client";

/**
 * WeightSweepMarquee — Interaction Pattern A
 * Source of truth: .claude/skills/motion-library/SKILL.md
 *
 * A seamless horizontal ticker whose items interpolate their variable-font
 * weight (300 → 800) and ink (#475569 → #FAFAFA / #CCFF00) by proximity to a
 * focal point: the viewport centre at rest, the cursor X while hovered.
 *
 * Performance contract:
 *  - Zero React state in the loop. One `useAnimationFrame` tick translates the
 *    track and re-weights every item via direct DOM writes.
 *  - Item centres are cached from `offsetLeft` and refreshed only by a
 *    ResizeObserver, so the tick performs no layout reads.
 *  - Every item reserves its 800-weight width with an invisible ghost layer,
 *    so weight changes never reflow the track (cached offsets stay valid and
 *    the -50% wrap point stays exact).
 */

import { useAnimationFrame, useMotionValue } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

export const SWEEP_RADIUS = 320;
export const WGHT_MIN = 300;
export const WGHT_MAX = 800;

const INK_REST: RGB = [71, 85, 105]; // #475569 Deep Steel
const INK_FOCUS: RGB = [250, 250, 250]; // #FAFAFA Titanium White
const INK_HOT: RGB = [204, 255, 0]; // #CCFF00 Electric Lime (pointer focus)

type RGB = [number, number, number];

export interface WeightSweepMarqueeProps<T> {
  items: readonly T[];
  getKey: (item: T) => string;
  /** `ghost` is true for the invisible max-weight sizing copy — skip any animated work there. */
  renderItem: (item: T, ghost: boolean) => ReactNode;
  /** Base translation speed in px/s. */
  speed?: number;
  /** Influence radius R in px. */
  radius?: number;
  /** Speed multiplier while the pointer is over the track. */
  hoverSpeedFactor?: number;
  className?: string;
  /** Rendered between items (part of each item cell so both halves stay equal). */
  separator?: ReactNode;
}

/** d = min(1, |Xi − Xf| / R); ease = (1 − d)²; wght = round(300 + 500·ease) */
export function sweepWeight(itemX: number, focalX: number, radius = SWEEP_RADIUS) {
  const d = Math.min(1, Math.abs(itemX - focalX) / radius);
  const ease = (1 - d) * (1 - d);
  return { ease, wght: Math.round(WGHT_MIN + (WGHT_MAX - WGHT_MIN) * ease) };
}

function mix(a: RGB, b: RGB, t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

export function WeightSweepMarquee<T>({
  items,
  getKey,
  renderItem,
  speed = 48,
  radius = SWEEP_RADIUS,
  hoverSpeedFactor = 0.35,
  className = "",
  separator,
}: WeightSweepMarqueeProps<T>) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const itemEls = useRef<(HTMLElement | null)[]>([]);

  // Cached geometry — written only by the ResizeObserver.
  const centers = useRef<number[]>([]);
  const halfWidth = useRef(0);
  const viewportLeft = useRef(0);

  // Pointer / loop state — refs only, never React state.
  const focalX = useRef<number | null>(null);
  const hovered = useRef(false);
  const speedScale = useRef(1);
  const reducedMotion = useRef(false);
  const lastWght = useRef<number[]>([]);
  const lastInk = useRef<string[]>([]);

  const x = useMotionValue(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const measure = () => {
      // New item nodes (market switch) start at the SSR/initial style, so the
      // diff caches must be cleared or the first sweep write would be skipped.
      lastWght.current = [];
      lastInk.current = [];
      viewportLeft.current = viewport.getBoundingClientRect().left;
      halfWidth.current = track.scrollWidth / 2;
      centers.current = itemEls.current.map((el) =>
        el ? el.offsetLeft + el.offsetWidth / 2 : 0,
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    ro.observe(track);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPref = () => (reducedMotion.current = mq.matches);
    syncMotionPref();
    mq.addEventListener("change", syncMotionPref);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      mq.removeEventListener("change", syncMotionPref);
    };
  }, [items]);

  useAnimationFrame((_, delta) => {
    const track = trackRef.current;
    const half = halfWidth.current;
    if (!track || half === 0) return;

    // 1. Translation — eased speed, seamless wrap at -50%.
    const targetScale = hovered.current ? hoverSpeedFactor : 1;
    speedScale.current += (targetScale - speedScale.current) * 0.08;
    const v = reducedMotion.current ? 0 : speed * speedScale.current;

    let next = x.get() - (v * Math.min(delta, 64)) / 1000;
    // Modulo wrap: also correct when a dataset swap shrinks the track below |x|.
    if (next <= -half) next %= half;
    x.set(next);
    track.style.transform = `translate3d(${next}px, 0, 0)`;

    // 2. Weight sweep — virtual X from cached offsets, no layout reads.
    const focal = focalX.current ?? window.innerWidth / 2;
    const hot = hovered.current;
    const els = itemEls.current;
    const origin = viewportLeft.current + next;

    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (!el) continue;
      const { ease, wght } = sweepWeight(origin + centers.current[i], focal, radius);

      if (lastWght.current[i] !== wght) {
        el.style.fontVariationSettings = `'wght' ${wght}`;
        el.style.fontWeight = String(wght);
        lastWght.current[i] = wght;
      }

      const ink = mix(INK_REST, hot ? INK_HOT : INK_FOCUS, ease);
      if (lastInk.current[i] !== ink) {
        el.style.color = ink;
        lastInk.current[i] = ink;
      }
    }
  });

  const doubled = [...items, ...items];

  return (
    <div
      ref={viewportRef}
      className={`relative h-full min-w-0 flex-1 overflow-hidden ${className}`}
      onPointerEnter={() => (hovered.current = true)}
      onPointerMove={(e) => (focalX.current = e.clientX)}
      onPointerLeave={() => {
        hovered.current = false;
        focalX.current = null;
      }}
    >
      <div
        ref={trackRef}
        className="relative flex h-full w-max items-center will-change-transform"
      >
        {doubled.map((item, i) => {
          const content = (ghost: boolean) => (
            <>
              {renderItem(item, ghost)}
              {separator}
            </>
          );
          return (
            <span
              key={`${getKey(item)}-${i < items.length ? "a" : "b"}`}
              ref={(el) => {
                itemEls.current[i] = el;
              }}
              aria-hidden={i >= items.length || undefined}
              className="inline-grid h-full shrink-0 items-center whitespace-nowrap text-[#475569]"
              style={{ fontVariationSettings: `'wght' ${WGHT_MIN}`, fontWeight: WGHT_MIN }}
            >
              {/* Ghost layer reserves the 800-weight footprint → zero reflow. */}
              <span
                aria-hidden
                className="invisible col-start-1 row-start-1 flex items-center"
                style={{ fontVariationSettings: `'wght' ${WGHT_MAX}`, fontWeight: WGHT_MAX }}
              >
                {content(true)}
              </span>
              <span className="col-start-1 row-start-1 flex items-center justify-self-center">
                {content(false)}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default WeightSweepMarquee;

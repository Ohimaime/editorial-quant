"use client";

/**
 * ZeroLatencyGlyphDecode — Interaction Pattern D
 * Source of truth: .claude/skills/motion-library/SKILL.md
 *
 * Content swaps are 0ms cuts. Immediately after a swap, text nodes run a
 * mechanical decode burst: every character cycles through quant glyphs on
 * each animation frame and locks onto its final value after 4–6 frames,
 * left-to-right, with an 8ms stagger per column index. The burst is
 * time-based (identical on 60Hz and 120Hz displays) and never touches
 * opacity.
 *
 * DOM ownership: React renders the final string as a single text node. The
 * decode mutates that SAME node's `nodeValue` (never replaces it), so React's
 * reconciliation stays valid; the burst always ends by writing the latest
 * React text back.
 */

import { useEffect, useLayoutEffect, useRef, type ElementType, type RefObject } from "react";
import { useAppStore } from "@/store/useAppStore";

export const DECODE_GLYPHS = ["0", "1", "X", "#", "/", "8", "+"] as const;
/** Frame budget per character (at 60Hz): 4–6 frames before lock. */
export const DECODE_FRAME_MS = 1000 / 60;
export const DECODE_MIN_FRAMES = 4;
export const DECODE_MAX_FRAMES = 6;
/** Left→right lock spread inside one string. */
export const DECODE_CHAR_SPREAD_MS = 40;
/** Per-column-index start offset. */
export const DECODE_COLUMN_STAGGER_MS = 8;
/** One element's burst: 6 frames (100ms) + 40ms char spread = 140ms. */
export const DECODE_DURATION_MS = DECODE_MAX_FRAMES * DECODE_FRAME_MS + DECODE_CHAR_SPREAD_MS;

/** Structural characters keep their position so the data shape reads through the noise. */
const STRUCTURAL = new Set([" ", ".", ":", ",", "%", "$", "@", "—", "→", "'"]);

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Tiny deterministic PRNG (mulberry32) so a given switch always renders the same burst. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Lock time (ms after the element's start) for each character of `text`. */
export function decodeSchedule(text: string, seed: number): number[] {
  const rand = prng(seed);
  const n = text.length;
  return Array.from(text, (_, j) => {
    const frames = DECODE_MIN_FRAMES + Math.floor(rand() * (DECODE_MAX_FRAMES - DECODE_MIN_FRAMES + 1));
    const spread = n > 1 ? (j / (n - 1)) * DECODE_CHAR_SPREAD_MS : 0;
    return frames * DECODE_FRAME_MS + spread;
  });
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Triggers are monotonically increasing counters (switch ticks, focus epochs).
 * A decode burst runs when `triggerKey` INCREASES to a positive value, or on
 * mount when `triggerKey > 0` (a node created by a market switch).
 * `triggerKey <= 0` is idle (first paint after boot). Because only increases
 * fire, a composite trigger (e.g. `isFocused ? focusCounter : switchTick`)
 * decodes when an element gains focus but stays silent when it loses focus.
 */
export function useTelemetryScramble<T extends HTMLElement>(
  text: string,
  triggerKey: number,
  columnIndex = 0,
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const latestText = useRef(text);
  const lastTrigger = useRef<number | null>(null);
  const raf = useRef(0);

  useIsoLayoutEffect(() => {
    latestText.current = text;
  }, [text]);

  useIsoLayoutEffect(() => {
    const prev = lastTrigger.current;
    lastTrigger.current = triggerKey;
    if (triggerKey <= 0 || (prev !== null && triggerKey <= prev)) return;

    const node = ref.current?.firstChild;
    if (!node || node.nodeType !== Node.TEXT_NODE || prefersReducedMotion()) return;

    const target = latestText.current;
    const seed = triggerKey * 7919 + columnIndex * 104729 + target.length;
    const rand = prng(seed ^ 0x9e3779b9);
    const locks = decodeSchedule(target, seed);
    const startOffset = columnIndex * DECODE_COLUMN_STAGGER_MS;
    const t0 = performance.now();

    const frame = (now: number) => {
      const elapsed = now - t0 - startOffset;
      // Live text may have changed mid-burst (e.g. an odds tick): always lock to latest.
      const final = latestText.current;
      let out = "";
      let done = true;
      for (let j = 0; j < final.length; j++) {
        const ch = final[j];
        if (STRUCTURAL.has(ch) || elapsed >= (locks[j] ?? DECODE_DURATION_MS)) {
          out += ch;
        } else {
          out += DECODE_GLYPHS[Math.floor(rand() * DECODE_GLYPHS.length)];
          done = false;
        }
      }
      node.nodeValue = out;
      if (!done) raf.current = requestAnimationFrame(frame);
    };

    // First scrambled frame is written synchronously in the layout phase, so
    // the swapped data never paints un-scrambled for a frame.
    frame(t0);

    return () => {
      cancelAnimationFrame(raf.current);
      node.nodeValue = latestText.current;
    };
  }, [triggerKey, columnIndex]);

  return ref;
}

export interface DecodeTextProps {
  text: string | number;
  /** Column index → 8ms × index start stagger. */
  index?: number;
  /** Override the trigger (defaults to the store's `marketSwitchTick`). ≤ 0 = idle. */
  trigger?: number;
  as?: ElementType;
  className?: string;
  title?: string;
}

/** Drop-in text node that decodes on every market switch (or a custom trigger). */
export function DecodeText({ text, index = 0, trigger, as: Tag = "span", className, title }: DecodeTextProps) {
  const storeTick = useAppStore((s) => s.marketSwitchTick);
  const value = String(text);
  const ref = useTelemetryScramble<HTMLElement>(value, trigger ?? storeTick, index);
  return (
    <Tag ref={ref} className={className} title={title}>
      {value}
    </Tag>
  );
}

export default DecodeText;

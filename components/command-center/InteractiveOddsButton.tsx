"use client";

/**
 * InteractiveOddsButton — primary 3× scale bet trigger (memoized leaf).
 *
 * Owns its own simulated WebSocket stream, gated on `isBooted`. A tick
 * re-renders THIS button only: price in local state, the 150ms delta flash on
 * a GSAP-owned layer, the magnetic pull mutating the payload transform
 * directly. Nothing propagates to the console, track or page.
 */

import gsap from "gsap";
import { memo, useEffect, useRef, useState } from "react";
import { useMagneticPull } from "@/components/motion/MagneticTelemetryCell";
import { DecodeText } from "@/components/motion/ZeroLatencyGlyphDecode";
import {
  FLASH_DECAY,
  FLASH_HOLD,
  TICK_PROBABILITY,
  drawDirection,
  impliedProbability,
  nextTickDelay,
  stepAmerican,
} from "@/lib/market-sim";
import { expectedValue, formatAmerican, type Selection } from "@/lib/mock-panoramic-data";
import { useAppStore } from "@/store/useAppStore";

/* High-Stakes Broadcast tokens. */
const INK_REST = "#FAFAFA"; // Titanium White
const INK_SELECTED = "#05080F"; // Deep Midnight on Electric Lime
const PROB_UP = "#CCFF00"; // Electric Lime — implied probability up
const PROB_DOWN = "#FF00FF"; // Fuchsia — implied probability down
/** Peak-flash ink: dark on lime, white on fuchsia (contrast on each fill). */
const INK_FLASH_UP = "#05080F";
const INK_FLASH_DOWN = "#FAFAFA";

/** The 3× scale rule: primary numerals vs 10px metadata. */
/** Below lg the row is full-width thirds, so numerals step down one size. */
const PRIMARY = "font-mono text-2xl leading-none font-bold tracking-tight tabular-nums lg:text-3xl lg:leading-tight xl:text-4xl";

interface TickState {
  price: number;
  /** +1: implied probability rose on last tick; −1: fell; 0: no tick yet. */
  dir: 1 | -1 | 0;
  /** Implied-probability change on last tick, percentage points. */
  dProb: number;
}

export interface InteractiveOddsButtonProps {
  selection: Selection;
  /** Micro-label: SPREAD / MONEYLINE / TOTAL · OVER. */
  label: string;
  /** Static line: spread ("-4.5") or total ("224.5"). Omit for moneyline. */
  line?: string;
  selected: boolean;
  /** Receives the selection re-priced at the live tick price (price locks on staging). */
  onToggle: (selection: Selection) => void;
  /** Column index → glyph-decode stagger on market switch. */
  column?: number;
}

function InteractiveOddsButtonImpl({ selection, label, line, selected, onToggle, column = 0 }: InteractiveOddsButtonProps) {
  const isBooted = useAppStore((s) => s.isBooted);
  const [tick, setTick] = useState<TickState>({ price: selection.price, dir: 0, dProb: 0 });

  const cellRef = useRef<HTMLButtonElement>(null);
  const payloadRef = useRef<HTMLSpanElement>(null);
  const flashRef = useRef<HTMLSpanElement>(null);
  const priceRef = useRef(selection.price);
  const selectedRef = useRef(selected);
  const flashTl = useRef<gsap.core.Timeline | null>(null);

  const magnet = useMagneticPull(cellRef, payloadRef);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  // ── Simulated WebSocket stream: dormant until boot, jittered, paused when hidden ──
  useEffect(() => {
    if (!isBooted) return;
    const anchor = selection.price;
    let timer: number | undefined;

    // Flash: instant peak → 150ms hold → 450ms power2.out decay. The layer fades
    // over the button's own surface (deck #0A101D, or #CCFF00 when staged).
    const flash = (probUp: boolean) => {
      const layer = flashRef.current;
      const payload = payloadRef.current;
      if (!layer || !payload) return;
      flashTl.current?.kill();
      const restInk = selectedRef.current ? INK_SELECTED : INK_REST;
      flashTl.current = gsap
        .timeline()
        .set(layer, { backgroundColor: probUp ? PROB_UP : PROB_DOWN, opacity: 1 })
        .set(payload, { color: probUp ? INK_FLASH_UP : INK_FLASH_DOWN })
        .to(layer, { opacity: 0, duration: FLASH_DECAY, ease: "power2.out" }, FLASH_HOLD)
        .to(payload, { color: restInk, duration: FLASH_DECAY, ease: "power2.out" }, FLASH_HOLD)
        .set(payload, { clearProps: "color" });
    };

    const fire = () => {
      const prev = priceRef.current;
      const next = stepAmerican(prev, drawDirection(prev, anchor));
      const pPrev = impliedProbability(prev);
      const pNext = impliedProbability(next);
      priceRef.current = next;
      setTick({ price: next, dir: pNext > pPrev ? 1 : -1, dProb: (pNext - pPrev) * 100 });
      flash(pNext > pPrev);
    };

    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(cycle, nextTickDelay());
    };
    const cycle = () => {
      if (!document.hidden && Math.random() < TICK_PROBABILITY) fire();
      schedule();
    };
    const onVisibility = () => {
      if (document.hidden) window.clearTimeout(timer);
      else schedule();
    };

    if (!document.hidden) schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      flashTl.current?.kill();
    };
  }, [selection.price, isBooted]);

  const ev = expectedValue(selection.modelProb, tick.price);
  const price = formatAmerican(tick.price);

  return (
    <button
      ref={cellRef}
      type="button"
      aria-pressed={selected}
      aria-label={`${selection.label} ${price}`}
      onClick={() => onToggle({ ...selection, price: priceRef.current })}
      {...magnet}
      className={`relative flex h-full w-full flex-col justify-between gap-1.5 overflow-hidden rounded-none border px-3 py-2 text-left lg:gap-0 lg:py-3.5 transition-colors duration-100 xl:px-4 ${
        selected
          ? "border-[#CCFF00] bg-[#CCFF00] text-[#05080F]"
          : "border-transparent bg-[#0A101D] text-[#FAFAFA] hover:bg-[#162032]"
      }`}
    >
      {/* Flash layer — GSAP-owned, never touched by React after mount. */}
      <span ref={flashRef} aria-hidden className="pointer-events-none absolute inset-0 opacity-0" />

      <span
        className={`relative truncate font-mono text-[10px] uppercase tracking-[0.2em] ${selected ? "text-[#05080F]/70" : "text-[#8A99AD]"}`}
      >
        {label}
      </span>

      {/* Magnetic payload — inherits ink so the flash recolours it in one write. */}
      <span ref={payloadRef} className="relative flex flex-col items-start gap-1 whitespace-nowrap will-change-transform">
        {line ? (
          <>
            <DecodeText text={line} index={column} className={PRIMARY} />
            <DecodeText text={price} index={column} className={`${PRIMARY} opacity-60`} />
          </>
        ) : (
          <DecodeText text={price} index={column} className={PRIMARY} />
        )}
      </span>

      {/* Last tick: 4px triangle + Δ implied probability (percentage points). */}
      <span className="relative flex h-3 items-center justify-between gap-2 font-mono text-[10px] whitespace-nowrap tabular-nums">
        {tick.dir !== 0 ? (
          <span
            className={`flex items-center gap-1 ${
              selected ? "text-[#05080F]" : tick.dir > 0 ? "text-[#CCFF00]" : "text-[#FF00FF]"
            }`}
          >
            <svg width="4" height="4" viewBox="0 0 4 4" className="block" fill="currentColor" aria-hidden>
              {tick.dir > 0 ? <polygon points="0,4 2,0 4,4" /> : <polygon points="0,0 4,0 2,4" />}
            </svg>
            {`${tick.dProb > 0 ? "+" : ""}${tick.dProb.toFixed(2)}`}
          </span>
        ) : (
          <span />
        )}
        {ev > 0 && (
          <span className={selected ? "font-bold text-[#05080F]" : "text-[#CCFF00]"}>{`+${(ev * 100).toFixed(1)}% EV`}</span>
        )}
      </span>
    </button>
  );
}

export const InteractiveOddsButton = memo(InteractiveOddsButtonImpl);
InteractiveOddsButton.displayName = "InteractiveOddsButton";

export default InteractiveOddsButton;

"use client";

/**
 * PanoramicTrack — Tier 2: the horizontal 80vw snap track.
 *
 * Navigation is strictly horizontal:
 *  - native trackpad swipe / Shift+Wheel (horizontal deltas pass straight through);
 *  - vertical mouse wheels are mapped onto the horizontal axis, one console per
 *    notch (see WHEEL_STEP) — raw `scrollLeft += deltaY` cannot work under
 *    `snap-mandatory`, because the browser re-snaps every sub-console nudge back
 *    to the current console;
 *  - ← / → arrow keys, the edge arrows (gutters on lg, poster on md) and the Tier 1 quick-jump
 *    pills (store `consoleJump`).
 * An IntersectionObserver (threshold 0.6) reports the snapped console.
 *
 * Scroll affordance: from lg, the 10vw peek gutters carry an edge mask (the
 * neighbouring console fades into the canvas) plus a 48px arrow; both drop on
 * the side with nothing further to show. These live in a separate leaf
 * (`TrackAffordances`) so the track itself never re-renders on a console change.
 */

import { useEffect, useRef } from "react";
import { ConsoleArrow } from "@/components/command-center/ConsoleArrow";
import { MatchupConsole } from "@/components/command-center/MatchupConsole";
import { CONSOLE_COUNT, getMarketData, type Selection } from "@/lib/mock-panoramic-data";
import { useAppStore } from "@/store/useAppStore";

/** Accumulated vertical wheel delta that advances one console. */
export const WHEEL_STEP = 40;
/** Minimum interval between wheel-driven console steps (one smooth scroll). */
export const WHEEL_COOLDOWN_MS = 420;
/** Accumulator resets after this much wheel silence. */
const WHEEL_IDLE_MS = 180;

const clamp = (i: number) => Math.max(0, Math.min(CONSOLE_COUNT - 1, i));

/** Scroll so console `index` is centred (matches `snap-center`). */
export function scrollToConsole(track: HTMLElement, index: number, behavior: ScrollBehavior = "smooth") {
  const el = track.querySelector<HTMLElement>(`[data-console][data-index="${index}"]`);
  if (!el) return;
  track.scrollTo({ left: el.offsetLeft - (track.clientWidth - el.clientWidth) / 2, behavior });
}

export interface PanoramicTrackProps {
  selectedKeys: ReadonlySet<string>;
  onToggleSelection: (selection: Selection) => void;
}

export function PanoramicTrack({ selectedKeys, onToggleSelection }: PanoramicTrackProps) {
  const market = useAppStore((s) => s.activeMarket);
  const consoleJump = useAppStore((s) => s.consoleJump);
  const { matchups, profile } = getMarketData(market);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // ── Snapped-console detection ──
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) {
            useAppStore.getState().setActiveConsoleIndex(Number((e.target as HTMLElement).dataset.index));
          }
        }
      },
      { root: track, threshold: 0.6 },
    );
    track.querySelectorAll("[data-console]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // ── Quick-jump requests (Tier 1 pills, arrow keys) ──
  useEffect(() => {
    if (consoleJump.seq === 0 || !trackRef.current) return;
    scrollToConsole(trackRef.current, clamp(consoleJump.index));
  }, [consoleJump]);

  // ── Vertical wheel → horizontal console steps (non-passive to own the event) ──
  // Bound to the stage (track + edge arrows) so the wheel pans anywhere over it.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let acc = 0;
    let lastStep = 0;
    let lastWheel = 0;
    const onWheel = (e: WheelEvent) => {
      // Horizontal intent (trackpad swipe, Shift+Wheel): let native scroll + snap handle it.
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY) || e.shiftKey) return;
      // Below lg a console with its telemetry expanded scrolls vertically:
      // let the wheel scroll it until it hits an end, then step consoles.
      const c = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-console]") : null;
      if (c && c.scrollHeight > c.clientHeight + 1) {
        const canUp = c.scrollTop > 0;
        const canDown = c.scrollTop + c.clientHeight < c.scrollHeight - 1;
        if ((e.deltaY < 0 && canUp) || (e.deltaY > 0 && canDown)) return;
      }
      e.preventDefault();
      const now = performance.now();
      if (now - lastWheel > WHEEL_IDLE_MS) acc = 0;
      lastWheel = now;
      acc += e.deltaY;
      if (Math.abs(acc) < WHEEL_STEP || now - lastStep < WHEEL_COOLDOWN_MS) return;
      const dir = Math.sign(acc);
      acc = 0;
      lastStep = now;
      const { activeConsoleIndex, jumpToConsole } = useAppStore.getState();
      const next = clamp(activeConsoleIndex + dir);
      if (next !== activeConsoleIndex) jumpToConsole(next);
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, []);

  // ── ← / → arrow keys ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault();
      const { activeConsoleIndex, jumpToConsole } = useAppStore.getState();
      jumpToConsole(clamp(activeConsoleIndex + (e.key === "ArrowRight" ? 1 : -1)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={stageRef} className="relative w-full shrink-0">
      <div
        ref={trackRef}
        data-cursor-zone="telemetry-grid"
        aria-label="Matchup consoles"
        className="no-scrollbar flex h-[calc(100dvh-48px-128px)] w-full shrink-0 snap-x snap-mandatory scroll-smooth items-center gap-0 overflow-x-auto overflow-y-hidden px-0 lg:h-[calc(100dvh-48px-96px)] lg:gap-8 lg:px-[10vw]"
      >
        {matchups.map((m, i) => (
          // Keyed by POSITION: a market switch swaps data inside the same console
          // in 0ms; the track never jumps and the snapped console stays put.
          <MatchupConsole
            key={i}
            index={i}
            matchup={m}
            profile={profile}
            selectedKeys={selectedKeys}
            onToggleSelection={onToggleSelection}
          />
        ))}
      </div>
      <TrackAffordances />
    </div>
  );
}

/* ── Scroll affordances (lg+): edge masks + gutter arrows ─────────────── */

/**
 * Leaf subscribed to `activeConsoleIndex`: masks + arrows update on a console
 * change without re-rendering the track or its consoles.
 *  - Masks cover the 10vw peek gutters, fading the neighbouring console into
 *    the canvas: the cue that content continues off-screen. Each drops on the
 *    side with nothing further to show.
 *  - Arrows sit centred in the gutters. Below lg the consoles are full-width,
 *    so the arrows move into each console's poster (see MatchupConsole).
 */
function TrackAffordances() {
  const active = useAppStore((s) => s.activeConsoleIndex);
  const atStart = active <= 0;
  const atEnd = active >= CONSOLE_COUNT - 1;

  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block">
      {!atStart && <div aria-hidden className="absolute inset-y-0 left-0 w-[10vw] bg-gradient-to-r from-[#05080F] to-transparent" />}
      {!atEnd && <div aria-hidden className="absolute inset-y-0 right-0 w-[10vw] bg-gradient-to-l from-[#05080F] to-transparent" />}
      <ConsoleArrow dir={-1} disabled={atStart} className="absolute top-1/2 left-[calc(5vw-24px)] flex -translate-y-1/2" />
      <ConsoleArrow dir={1} disabled={atEnd} className="absolute top-1/2 right-[calc(5vw-24px)] flex -translate-y-1/2" />
    </div>
  );
}

export default PanoramicTrack;

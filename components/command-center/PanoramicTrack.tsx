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
 *  - ← / → arrow keys and the Tier 1 quick-jump pills (store `consoleJump`).
 * An IntersectionObserver (threshold 0.6) reports the snapped console.
 */

import { useEffect, useRef } from "react";
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
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let acc = 0;
    let lastStep = 0;
    let lastWheel = 0;
    const onWheel = (e: WheelEvent) => {
      // Horizontal intent (trackpad swipe, Shift+Wheel): let native scroll + snap handle it.
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY) || e.shiftKey) return;
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
    track.addEventListener("wheel", onWheel, { passive: false });
    return () => track.removeEventListener("wheel", onWheel);
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
  );
}

export default PanoramicTrack;

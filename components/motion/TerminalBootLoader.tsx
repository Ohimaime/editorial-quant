"use client";

/**
 * TerminalBootLoader — deterministic 2.50s cold-boot sequence (Pattern F).
 * Source of truth: .claude/skills/motion-library/SKILL.md
 *
 *   A  0.04–1.35s  diagnostic lines snap in (0ms), [WAIT] → [OK], counter 000.0 → 100.0%
 *      0.00–2.45s  2px Electric Lime progress hairline, stepped
 *   B  1.20–2.45s  1px hairlines draw the 3-tier panoramic architecture:
 *                  status line (48px) → centre console frame → dock line (bottom 96px)
 *   C  2.50s       0ms cut: overlay display:none → setBooted(true)
 *
 * Wall-clock exact: GSAP lag smoothing is disabled for the duration of the
 * boot so a long frame cannot stretch the timeline, and the timeline starts
 * on the first frame AFTER hydration (double rAF) so the hydration long task
 * cannot swallow the opening of Phase A either.
 */

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { useAppStore } from "@/store/useAppStore";

export const BOOT_DURATION = 2.5;
export const BOOT_PROGRESS_END = 2.45;
export const BOOT_COUNTER_END = 1.35;

export const BOOT_LOG: readonly { at: number; text: string }[] = [
  { at: 0.04, text: "INIT KERNEL // PANORAMIC-COMMAND-OS v5.0.0" },
  { at: 0.18, text: "CONNECTING TO WSS://QUANT.FEED.INTERNAL:443..." },
  { at: 0.42, text: "TLS 1.3 HANDSHAKE SECURED // LATENCY 0.41ms" },
  { at: 0.68, text: "MOUNTING MARKET SHARDS [NBA // NFL // SOCCER]" },
  { at: 0.94, text: "SPOOLING PANORAMIC TRACK [06 CONSOLES x 03 MARKETS]" },
  { at: 1.18, text: "ARMING KELLY ALLOCATOR // EXECUTION DOCK... OK" },
  { at: 1.32, text: "ALL TELEMETRY STREAMS NOMINAL // LOCKING COCKPIT" },
];

/**
 * SSR initial geometry as inline `transform` (not Tailwind `scale-*`, which
 * writes the separate CSS `scale` property and would multiply with GSAP's
 * transform, pinning the line at 0).
 */
const COLLAPSED_X = { transform: "scaleX(0)" } as const;
const COLLAPSED_Y = { transform: "scaleY(0)" } as const;

/** Nominal console frame (fallback before measurement): 80vw × 86% of the middle tier, centred. */
const TIER2 = "(100vh - 144px)";
const FRAME_FALLBACK = {
  left: "10vw",
  width: "80vw",
  top: `calc(48px + ${TIER2} * 0.07)`,
  height: `calc(${TIER2} * 0.86)`,
};

function stamp(seconds: number) {
  return `[00:${seconds.toFixed(2).padStart(5, "0")}]`;
}

export function TerminalBootLoader() {
  const isBooted = useAppStore((s) => s.isBooted);
  const setBooted = useAppStore((s) => s.setBooted);

  const overlayRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const overlay = overlayRef.current;
      if (!overlay || useAppStore.getState().isBooted) return;

      // Measure the live cockpit and pin every hairline onto its real border.
      const rect = (sel: string) => document.querySelector<HTMLElement>(sel)?.getBoundingClientRect();
      const status = rect('[data-boot-anchor="statusbar"]');
      const dock = rect('[data-boot-anchor="dock"]');
      const frame = rect('[data-console][data-index="0"]');
      if (status) overlay.style.setProperty("--hair-top", `${status.bottom - 1}px`);
      if (dock) overlay.style.setProperty("--hair-dock", `${dock.top}px`);
      if (frame) {
        overlay.style.setProperty("--frame-left", `${frame.left}px`);
        overlay.style.setProperty("--frame-top", `${frame.top}px`);
        overlay.style.setProperty("--frame-width", `${frame.width}px`);
        overlay.style.setProperty("--frame-height", `${frame.height}px`);
      }

      gsap.ticker.lagSmoothing(0);

      const q = gsap.utils.selector(overlay);
      const counter = { v: 0 };
      const clock = { t: 0 };
      const tl = gsap.timeline({
        paused: true,
        onComplete: () => {
          gsap.ticker.lagSmoothing(500, 33);
          setBooted(true);
        },
      });

      // ── Initial state ────────────────────────────────────────────────────
      tl.set(q("[data-boot-line]"), { visibility: "hidden" }, 0)
        .set(q("[data-boot-ok]"), { display: "none" }, 0)
        .set(q("[data-boot-wait]"), { display: "inline" }, 0)
        .set(q("[data-boot-progress]"), { scaleX: 0, transformOrigin: "left center" }, 0)
        .set(q("[data-hair-x]"), { scaleX: 0, transformOrigin: "left center" }, 0)
        .set(q("[data-hair-y]"), { scaleY: 0, transformOrigin: "top center" }, 0);

      // ── Phase A: diagnostics (0.04 → 1.35s) ──────────────────────────────
      const lines = q("[data-boot-line]");
      const waits = q("[data-boot-wait]");
      const oks = q("[data-boot-ok]");
      BOOT_LOG.forEach((entry, i) => {
        tl.set(lines[i], { visibility: "visible" }, entry.at);
        const doneAt = BOOT_LOG[i + 1]?.at ?? BOOT_COUNTER_END;
        tl.set(waits[i], { display: "none" }, doneAt).set(oks[i], { display: "inline" }, doneAt);
      });

      tl.to(
        counter,
        {
          v: 100,
          duration: BOOT_COUNTER_END,
          ease: "steps(54)",
          onUpdate: () => {
            if (counterRef.current) counterRef.current.textContent = `${counter.v.toFixed(1).padStart(5, "0")}%`;
          },
        },
        0,
      );
      tl.to(
        clock,
        {
          t: BOOT_DURATION,
          duration: BOOT_DURATION,
          ease: "none",
          onUpdate: () => {
            if (clockRef.current) clockRef.current.textContent = `T+${clock.t.toFixed(3)}s`;
          },
        },
        0,
      );
      tl.to(q("[data-boot-progress]"), { scaleX: 1, duration: BOOT_PROGRESS_END, ease: "steps(24)" }, 0);

      // ── Phase B: 3-tier hairlines (1.20 → 2.45s) ─────────────────────────
      tl.to(q("[data-hair='top']"), { scaleX: 1, duration: 0.55, ease: "power4.inOut" }, 1.2)
        .to(q("[data-hair='frame-y']"), { scaleY: 1, duration: 0.65, ease: "power4.inOut" }, 1.3)
        .to(q("[data-hair='frame-x']"), { scaleX: 1, duration: 0.65, ease: "power4.inOut", stagger: 0.06 }, 1.42)
        .to(q("[data-hair='dock']"), { scaleX: 1, duration: 0.55, ease: "power4.inOut" }, 1.85);

      // ── Phase C: 0ms cut at exactly 2.50s ────────────────────────────────
      tl.set(overlay, { display: "none" }, BOOT_DURATION);

      // T+0 = first painted frame after hydration.
      let raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => tl.play(0));
      });

      return () => {
        cancelAnimationFrame(raf);
        gsap.ticker.lagSmoothing(500, 33);
      };
    },
    { scope: overlayRef },
  );

  if (isBooted) return null;

  const frame = {
    left: `var(--frame-left, ${FRAME_FALLBACK.left})`,
    top: `var(--frame-top, ${FRAME_FALLBACK.top})`,
    width: `var(--frame-width, ${FRAME_FALLBACK.width})`,
    height: `var(--frame-height, ${FRAME_FALLBACK.height})`,
  };

  return (
    <div
      ref={overlayRef}
      role="status"
      aria-label="Terminal booting"
      className="fixed inset-0 z-[100] overflow-hidden bg-[#05080F] font-mono text-[#FAFAFA] select-none"
    >
      {/* ── Phase B geometry: measured from [data-boot-anchor] / [data-console] ── */}
      <div aria-hidden>
        {/* Tier 1: status hairline (48px) */}
        <span
          data-hair-x
          data-hair="top"
          className="absolute top-[var(--hair-top,47px)] left-0 h-px w-full origin-left bg-[#162032]"
          style={COLLAPSED_X}
        />
        {/* Tier 2: centre console frame — left & right edges draw down, top & bottom draw across */}
        <span
          data-hair-y
          data-hair="frame-y"
          className="absolute w-px origin-top bg-[#162032]"
          style={{ ...COLLAPSED_Y, left: frame.left, top: frame.top, height: frame.height }}
        />
        <span
          data-hair-y
          data-hair="frame-y"
          className="absolute w-px origin-top bg-[#162032]"
          style={{ ...COLLAPSED_Y, left: `calc(${frame.left} + ${frame.width} - 1px)`, top: frame.top, height: frame.height }}
        />
        <span
          data-hair-x
          data-hair="frame-x"
          className="absolute h-px origin-left bg-[#162032]"
          style={{ ...COLLAPSED_X, left: frame.left, top: frame.top, width: frame.width }}
        />
        <span
          data-hair-x
          data-hair="frame-x"
          className="absolute h-px origin-left bg-[#162032]"
          style={{ ...COLLAPSED_X, left: frame.left, top: `calc(${frame.top} + ${frame.height} - 1px)`, width: frame.width }}
        />
        {/* Tier 3: dock hairline (bottom 96px) */}
        <span
          data-hair-x
          data-hair="dock"
          className="absolute top-[var(--hair-dock,calc(100vh-96px))] left-0 h-px w-full origin-left bg-[#162032]"
          style={COLLAPSED_X}
        />
      </div>

      {/* ── Phase A: diagnostic panel, inside the console frame ── */}
      <div className="absolute pt-10 pl-10" style={{ left: frame.left, top: frame.top, width: `min(640px, ${frame.width})` }}>
        <div className="flex items-baseline justify-between border-b border-[#162032] pb-2">
          <span className="text-[10px] tracking-[0.14em] text-[#8A99AD] uppercase">Cold Boot {"//"} System Check</span>
          <span ref={clockRef} className="text-[10px] text-[#475569] tabular-nums">
            T+0.000s
          </span>
        </div>

        <div className="mt-4 flex items-baseline gap-4">
          <span ref={counterRef} className="font-sans text-5xl font-light tracking-tight tabular-nums">
            000.0%
          </span>
          <span className="text-[10px] tracking-[0.14em] text-[#8A99AD] uppercase">Memory / Handshake</span>
        </div>

        <ol className="mt-5 space-y-1.5 text-[11px] leading-[1.5] tabular-nums">
          {BOOT_LOG.map((entry) => (
            <li key={entry.at} data-boot-line className="invisible flex gap-3 whitespace-nowrap">
              <span className="text-[#475569]">{stamp(entry.at)}</span>
              <span className="min-w-0 flex-1 truncate text-[#FAFAFA]">{entry.text}</span>
              <span className="w-12 text-right">
                <span data-boot-wait className="text-[#475569]">
                  [WAIT]
                </span>
                <span data-boot-ok className="hidden text-[#CCFF00]">
                  [OK]
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* ── 2px stepped progress hairline ── */}
      <div className="absolute right-0 bottom-0 left-0 h-[2px] bg-[#0A101D]">
        <div data-boot-progress className="h-full w-full origin-left bg-[#CCFF00]" style={COLLAPSED_X} />
      </div>
    </div>
  );
}

export default TerminalBootLoader;

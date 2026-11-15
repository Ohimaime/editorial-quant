"use client";

/**
 * WelcomeBriefing — first-run operator briefing (UI chrome, Pattern G family).
 *
 * Appears on the first frame after the TerminalBootLoader's 0ms cut, only for
 * operators who have not dismissed it before (persisted in localStorage; if
 * storage is unavailable it simply shows once per page load). Dismissal is a
 * 0ms cut, consistent with the boot release.
 *
 * While open it owns the keyboard: ← / → and `?` are swallowed in the capture
 * phase so the track and glossary behind it don't move, Tab is trapped on the
 * single CTA, and Escape dismisses.
 */

import { useEffect, useId, useRef, useState } from "react";
import { MagneticWrapper } from "@/components/motion/MagneticWrapper";
import { useAppStore } from "@/store/useAppStore";

export const BRIEFING_STORAGE_KEY = "eq:briefing-dismissed";

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(BRIEFING_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed() {
  try {
    window.localStorage.setItem(BRIEFING_STORAGE_KEY, "1");
  } catch {
    /* storage blocked: the briefing just shows again next load */
  }
}

const STEPS: readonly { title: string; body: string }[] = [
  {
    title: "Navigate",
    body: "Six live matchup consoles sit side by side. Scroll your wheel, swipe, press ← → or use the edge arrows to move between them.",
  },
  {
    title: "Read the edge",
    body: "Electric Lime marks positive expected value. Fuchsia flags adverse moves and thin books. Open [ ? ] for the full field manual.",
  },
  {
    title: "Execute",
    body: "Tap any Spread, Moneyline or Total cell to stage it on the dock below, size it with fractional Kelly, then Engage.",
  },
];

export function WelcomeBriefing() {
  const isBooted = useAppStore((s) => s.isBooted);
  const [dismissed, setDismissed] = useState(false);
  // isBooted is false during SSR and hydration, so storage is only read client-side.
  const open = isBooted && !dismissed && !readDismissed();

  const ctaRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  const dismiss = () => {
    writeDismissed();
    setDismissed(true);
  };

  useEffect(() => {
    if (!open) return;
    ctaRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        writeDismissed();
        setDismissed(true);
      } else if (e.key === "Tab") {
        e.preventDefault();
        ctaRef.current?.focus();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "?") {
        e.stopPropagation();
      }
    };
    // Capture on document runs before the window listeners of the track/glossary.
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#05080F]/90 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="max-h-full w-full max-w-[560px] overflow-y-auto rounded-none border border-[#CCFF00] bg-[#05080F]"
      >
        <header className="flex h-11 items-center justify-between gap-3 border-b border-[#162032] bg-[#0A101D] px-5 font-mono text-[10px] tracking-[0.2em] uppercase">
          <span className="flex items-center gap-2 text-[#CCFF00]">
            <span aria-hidden className="eq-pulse size-1.5 bg-[#CCFF00]" />
            Operator Briefing
          </span>
          <span className="text-[#475569]">Session 01</span>
        </header>

        <div className="space-y-2 px-5 pt-5 pb-4 lg:px-7 lg:pt-6 lg:pb-5">
          <h2 id={titleId} className="font-display text-3xl leading-[0.9] tracking-[-0.01em] text-[#FAFAFA] uppercase lg:text-5xl">
            High-Stakes Broadcast Terminal
          </h2>
          <p id={descId} className="font-mono text-[11px] tracking-[0.18em] text-[#8A99AD] uppercase">
            A quantitative sports betting environment.
          </p>
        </div>

        <ol className="divide-y divide-[#162032] border-y border-[#162032]">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4 px-5 py-3 lg:px-7 lg:py-3.5">
              <span className="font-mono text-[10px] text-[#475569] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0 space-y-1">
                <div className="font-mono text-xs font-bold tracking-[0.14em] text-[#CCFF00] uppercase">{step.title}</div>
                <p className="text-[13px] leading-relaxed text-[#FAFAFA]">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:py-5 lg:items-center lg:justify-between lg:px-7">
          <span className="font-mono text-[10px] tracking-[0.14em] text-[#475569] uppercase">
            Simulated market feed {"//"} no real wagers
          </span>
          <button
            ref={ctaRef}
            type="button"
            onClick={dismiss}
            className="relative h-12 overflow-hidden rounded-none bg-[#CCFF00] px-6 font-mono text-xs font-bold tracking-[0.22em] text-[#05080F] uppercase outline-offset-2 hover:bg-[#FAFAFA] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#CCFF00]"
          >
            <MagneticWrapper hitArea="parent" maxPull={10}>
              <span>Enter Terminal →</span>
            </MagneticWrapper>
          </button>
        </div>
      </section>
    </div>
  );
}

export default WelcomeBriefing;

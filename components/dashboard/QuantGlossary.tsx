"use client";

/**
 * QuantGlossary — field-manual pop-up that decodes the console's quant
 * telemetry in plain English.
 *
 * Trigger: fixed bottom-left, just above the 96px ExecutionDock. Toggles on
 * click or `?`; `Escape` closes. The panel is a Framer Motion AnimatePresence
 * slide-over (UI chrome, not market data — the 0ms-cut rule applies to data).
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useState } from "react";
import { MagneticWrapper } from "@/components/motion/MagneticWrapper";

interface GlossaryEntry {
  term: string;
  definition: string;
  rule: string;
  example: "ev" | "clv" | "handle";
}

const ENTRIES: readonly GlossaryEntry[] = [
  {
    term: "EV Edge (Expected Value)",
    definition:
      "The mathematical profit margin a bet holds over the sportsbook's implied odds across 1,000 simulated outcomes.",
    rule: "Look for Electric Lime (+EV) cells — anything above +3.0% signals a high-conviction mathematical pricing error in your favor.",
    example: "ev",
  },
  {
    term: "CLV (Closing Line Value)",
    definition:
      "Measures whether the line you locked in beats the final “closing” line right before tip-off, when market efficiency is sharpest.",
    rule: "Consistently beating the closing line (e.g. grabbing −3.0 before it moves to −4.5) is the #1 indicator of long-term profitability.",
    example: "clv",
  },
  {
    term: "Handle Split (Sharp vs. Public)",
    definition:
      "Compares the percentage of total tickets placed (Public) against the percentage of total dollars wagered (Sharp institutional money).",
    rule: "When 30% of tickets account for 75%+ of the total money, syndicates are heavily backing that side.",
    example: "handle",
  },
];

function Example({ kind }: { kind: GlossaryEntry["example"] }) {
  if (kind === "ev") {
    return (
      <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
        <span className="bg-[#CCFF00] px-2 py-0.5 font-bold text-[#05080F]">+4.2% EV</span>
        <span className="text-[#475569]">vs</span>
        <span className="border border-[#162032] px-2 py-0.5 text-[#FF00FF]">−1.7% EV</span>
        <span className="text-[#8A99AD]">→ take the lime</span>
      </div>
    );
  }
  if (kind === "clv") {
    return (
      <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
        <span className="border border-[#CCFF00] px-2 py-0.5 text-[#CCFF00]">LOCKED −3.0</span>
        <span className="text-[#475569]">→</span>
        <span className="border border-[#162032] px-2 py-0.5 text-[#FAFAFA]">CLOSE −4.5</span>
        <span className="text-[#CCFF00]">+1.5 PTS CLV</span>
      </div>
    );
  }
  return (
    <div className="space-y-1.5 font-mono text-[10px] tracking-[0.12em] uppercase tabular-nums">
      <div className="flex items-center gap-2">
        <span className="w-14 text-[#8A99AD]">Tickets</span>
        <span className="flex h-1 flex-1 bg-[#162032]">
          <span className="h-full w-[30%] bg-[#8A99AD]" />
        </span>
        <span className="w-8 text-right text-[#8A99AD]">30%</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-14 text-[#FF00FF]">Money</span>
        <span className="flex h-1 flex-1 bg-[#162032]">
          <span className="h-full w-[78%] bg-[#FF00FF]" />
        </span>
        <span className="w-8 text-right text-[#FF00FF]">78%</span>
      </div>
    </div>
  );
}

export function QuantGlossary() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "?" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault();
      setOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Floating CTA: the WHOLE box pulls. The wrapper carries the fixed
          positioning — a transformed ancestor would otherwise become the
          containing block for a `fixed` button and detach it from the viewport. */}
      {/* Below lg it docks into the top bar's free right corner (48×48) so it never
          covers the odds rows; from lg it floats bottom-left above the dock. */}
      <MagneticWrapper hitArea="self" className="fixed top-0 right-0 z-50 lg:top-auto lg:right-auto lg:bottom-[calc(76px_+_(100dvh_-_144px)_*_0.035)] lg:left-6">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-keyshortcuts="?"
          aria-label="Quant glossary"
          className="group flex h-12 w-12 items-center justify-center gap-2.5 rounded-none border-0 border-l border-[#162032] bg-[#0A101D] font-mono text-xs font-bold tracking-[0.18em] text-[#CCFF00] uppercase transition-colors hover:bg-[#CCFF00] hover:text-[#05080F] lg:h-10 lg:w-auto lg:justify-start lg:border lg:border-[#CCFF00] lg:px-3.5 lg:text-[#FAFAFA]"
        >
          <span aria-hidden className="size-1.5 bg-[#CCFF00] group-hover:bg-[#05080F] max-lg:hidden" />
          <span aria-hidden className="lg:hidden">?</span>
          <span className="max-lg:hidden">[ ? ] Quant Glossary</span>
        </button>
      </MagneticWrapper>

      <AnimatePresence>
        {open && (
          <motion.section
            id={panelId}
            role="dialog"
            aria-modal="false"
            aria-labelledby={titleId}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-14 right-2 left-2 z-50 max-h-[calc(100dvh-56px-140px)] overflow-y-auto rounded-none border border-[#CCFF00] bg-[#05080F] lg:top-auto lg:right-auto lg:bottom-[160px] lg:left-6 lg:max-h-[calc(100dvh-220px)] lg:w-[420px] lg:max-w-[calc(100vw-3rem)]"
          >
            <header className="flex h-11 items-center justify-between border-b border-[#162032] bg-[#0A101D] px-5">
              <h2 id={titleId} className="font-mono text-[11px] tracking-[0.2em] text-[#CCFF00] uppercase">
                Field Manual {"//"} Quant Telemetry Decoder
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-none font-mono text-[10px] tracking-[0.14em] text-[#8A99AD] uppercase hover:text-[#FAFAFA]"
              >
                [ Esc {"//"} Close ]
              </button>
            </header>

            <dl className="divide-y divide-[#162032]">
              {ENTRIES.map((entry, i) => (
                <div key={entry.term} className="space-y-2.5 px-5 py-4">
                  <dt className="flex items-baseline gap-3">
                    <span className="font-mono text-[10px] text-[#475569] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-mono text-xs font-bold tracking-[0.12em] text-[#CCFF00] uppercase">{entry.term}</span>
                  </dt>
                  <dd className="space-y-2.5">
                    <p className="text-[13px] leading-relaxed text-[#FAFAFA]">{entry.definition}</p>
                    <p className="border-l border-[#CCFF00] pl-3 text-[12px] leading-relaxed text-[#8A99AD]">
                      <span className="font-mono text-[10px] tracking-[0.18em] text-[#FAFAFA] uppercase">Broadcast rule </span>
                      {entry.rule}
                    </p>
                    <Example kind={entry.example} />
                  </dd>
                </div>
              ))}
            </dl>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

export default QuantGlossary;

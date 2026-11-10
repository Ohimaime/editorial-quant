"use client";

import { useCallback, useMemo, useState } from "react";
import { ExecutionDock } from "@/components/command-center/ExecutionDock";
import { PanoramicTrack } from "@/components/command-center/PanoramicTrack";
import { TopStatusMarquee } from "@/components/command-center/TopStatusMarquee";
import { QuantGlossary } from "@/components/dashboard/QuantGlossary";
import { TerminalBootLoader } from "@/components/motion/TerminalBootLoader";
import { DEFAULT_SLIP_KEYS, selectionByKey, type Selection } from "@/lib/mock-panoramic-data";

/**
 * Panoramic Command Center — a 100vh locked, horizontally navigated cockpit.
 *
 *   Tier 1  TopStatusMarquee  48px   market switcher · console pills · alert ribbon
 *   Tier 2  PanoramicTrack    flex   80vw snap-centred matchup consoles
 *   Tier 3  ExecutionDock     96px   fixed avionics bet slip
 *
 * No sidebars, no hero, no vertical page scroll. Page state is limited to the
 * staged legs; boot, market and console focus live in the Zustand store.
 */
export default function Home() {
  // Legs are Selection snapshots: the price locks at the live tick price the
  // moment a button is pressed (InteractiveOddsButton passes its current price).
  const [slip, setSlip] = useState<Selection[]>(() =>
    DEFAULT_SLIP_KEYS.map(selectionByKey).filter((s): s is Selection => Boolean(s)),
  );
  const selectedKeys = useMemo(() => new Set(slip.map((s) => s.key)), [slip]);

  const toggleSelection = useCallback((s: Selection) => {
    setSlip((legs) => (legs.some((l) => l.key === s.key) ? legs.filter((l) => l.key !== s.key) : [...legs, s]));
  }, []);
  const removeSelection = useCallback((key: string) => {
    setSlip((legs) => legs.filter((l) => l.key !== key));
  }, []);

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden bg-[#05080F] text-[#FAFAFA]">
      <TerminalBootLoader />
      <TopStatusMarquee />
      <PanoramicTrack selectedKeys={selectedKeys} onToggleSelection={toggleSelection} />
      <ExecutionDock selections={slip} onRemove={removeSelection} />
      <QuantGlossary />
    </div>
  );
}

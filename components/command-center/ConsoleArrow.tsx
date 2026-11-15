"use client";

/**
 * ConsoleArrow — square edge arrow that steps the panoramic track one console.
 * Used twice: pinned in the 10vw peek gutters on desktop (TrackAffordances),
 * and inside each console's poster on tablets, where consoles are full-width.
 */

import { CONSOLE_COUNT } from "@/lib/mock-panoramic-data";
import { useAppStore } from "@/store/useAppStore";

export function stepConsole(dir: -1 | 1) {
  const { activeConsoleIndex, jumpToConsole } = useAppStore.getState();
  jumpToConsole(Math.max(0, Math.min(CONSOLE_COUNT - 1, activeConsoleIndex + dir)));
}

export function ConsoleArrow({ dir, disabled, className = "" }: { dir: -1 | 1; disabled: boolean; className?: string }) {
  return (
    <button
      type="button"
      aria-label={dir < 0 ? "Previous console" : "Next console"}
      disabled={disabled}
      onClick={() => stepConsole(dir)}
      className={`pointer-events-auto z-10 h-10 w-10 items-center justify-center rounded-none border bg-[#0A101D] transition-colors enabled:border-[#CCFF00] enabled:text-[#CCFF00] enabled:hover:bg-[#CCFF00] enabled:hover:text-[#05080F] disabled:border-[#162032] disabled:text-[#475569] lg:h-12 lg:w-12 ${className}`}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
        {dir < 0 ? <polyline points="9,2 4,7 9,12" /> : <polyline points="5,2 10,7 5,12" />}
      </svg>
    </button>
  );
}

export default ConsoleArrow;

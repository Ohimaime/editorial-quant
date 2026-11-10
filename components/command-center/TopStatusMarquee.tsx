"use client";

/**
 * TopStatusMarquee — Tier 1 (48px): market switcher, console position +
 * quick-jump pills, and the league-wide WeightSweepMarquee alert ribbon.
 */

import { useEffect } from "react";
import { WeightSweepMarquee } from "@/components/motion/WeightSweepMarquee";
import { DecodeText } from "@/components/motion/ZeroLatencyGlyphDecode";
import { CONSOLE_COUNT, getMarketData, type TickerItem, type Tone } from "@/lib/mock-panoramic-data";
import { MARKET_TYPES, useAppStore } from "@/store/useAppStore";

const TONE_INK: Record<Tone, string> = {
  up: "text-[#CCFF00]",
  down: "text-[#FF00FF]",
  pin: "text-[#FAFAFA]",
  flat: "text-[#8A99AD]",
};

const pad = (n: number) => String(n).padStart(2, "0");

function PlainText({ text, className }: { text: string; className?: string }) {
  return <span className={className}>{text}</span>;
}

function TickerToken({ item, ghost }: { item: TickerItem; ghost: boolean }) {
  // The invisible ghost copy only reserves max-weight width: plain text, no decode work.
  const T = ghost ? PlainText : DecodeText;
  return (
    <span className="flex items-center gap-2.5 px-4 uppercase">
      <T text={item.sym} className="font-sans text-[13px] tracking-[0.01em]" />
      <T text={item.text} className="font-mono text-[12px] tabular-nums" />
      <T text={item.delta} className={`font-mono text-[11px] tabular-nums ${TONE_INK[item.tone]}`} />
    </span>
  );
}

const getKey = (t: TickerItem) => t.id;
const renderToken = (t: TickerItem, ghost: boolean) => <TickerToken item={t} ghost={ghost} />;

export function TopStatusMarquee() {
  const market = useAppStore((s) => s.activeMarket);
  const active = useAppStore((s) => s.activeConsoleIndex);
  const setActiveMarket = useAppStore((s) => s.setActiveMarket);
  const jumpToConsole = useAppStore((s) => s.jumpToConsole);
  const { ticker } = getMarketData(market);

  // Hotkeys 1 / 2 / 3 → NBA / NFL / SOCCER.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest("input, textarea, select, [contenteditable='true']")) return;
      const next = MARKET_TYPES[Number(e.key) - 1];
      if (!next) return;
      e.preventDefault();
      useAppStore.getState().setActiveMarket(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      data-boot-anchor="statusbar"
      className="z-40 flex h-12 w-full shrink-0 items-center justify-between border-b border-[#162032] bg-[#05080F] max-lg:pr-12"
    >
      {/* ── Market selector ── */}
      <div role="tablist" aria-label="Market" className="flex h-full shrink-0 border-r border-[#162032]">
        {MARKET_TYPES.map((m, i) => {
          const on = m === market;
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={on}
              aria-keyshortcuts={String(i + 1)}
              onClick={() => setActiveMarket(m)}
              className={`flex h-full items-center gap-2 rounded-none border-r border-[#162032] px-3 font-mono text-[11px] tracking-[0.14em] uppercase lg:px-4 lg:text-xs lg:tracking-widest transition-none last:border-r-0 ${
                on ? "bg-[#CCFF00] font-bold text-[#05080F]" : "bg-[#05080F] text-[#8A99AD] hover:bg-[#0A101D] hover:text-[#FAFAFA]"
              }`}
            >
              {on && <span aria-hidden className="eq-pulse size-1.5 bg-[#05080F]" />}
              {m}
              <span className={`text-[9px] tracking-normal max-lg:hidden ${on ? "text-[#05080F]/50" : "text-[#475569]"}`}>[{i + 1}]</span>
            </button>
          );
        })}
      </div>

      {/* ── Console position + quick-jump pills ── */}
      <div className="flex h-full shrink-0 items-center gap-4 px-3 lg:border-r lg:border-[#162032] lg:px-4">
        <span className="font-mono text-[11px] tracking-[0.16em] text-[#8A99AD] uppercase tabular-nums">
          <span className="max-lg:hidden">Console </span>
          <span className="text-[#FAFAFA]">{pad(active + 1)}</span> / {pad(CONSOLE_COUNT)}
        </span>
        <nav aria-label="Jump to console" className="flex gap-px bg-[#162032] max-lg:hidden">
          {Array.from({ length: CONSOLE_COUNT }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => jumpToConsole(i)}
              aria-current={i === active ? "true" : undefined}
              className={`h-6 w-7 rounded-none font-mono text-[10px] tabular-nums transition-none ${
                i === active ? "bg-[#CCFF00] font-bold text-[#05080F]" : "bg-[#05080F] text-[#8A99AD] hover:text-[#FAFAFA]"
              }`}
            >
              {pad(i + 1)}
            </button>
          ))}
        </nav>
      </div>

      {/* ── League-wide alert ribbon ── */}
      <div className="hidden h-full min-w-0 flex-1 items-center overflow-hidden lg:flex">
        <WeightSweepMarquee
          items={ticker}
          getKey={getKey}
          renderItem={renderToken}
          separator={
            <span aria-hidden className="font-mono text-[11px] text-[#162032]">
              {"//"}
            </span>
          }
        />
      </div>
    </header>
  );
}

export default TopStatusMarquee;

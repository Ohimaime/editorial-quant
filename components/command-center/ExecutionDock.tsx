"use client";

/**
 * ExecutionDock — Tier 3 (96px): fixed full-width avionics bet slip.
 *
 *   cols 1–2   system & bankroll bay (status, bankroll, fractional Kelly)
 *   cols 3–7   active ticket strip (horizontal, staged legs with kill switches)
 *   cols 8–10  risk & payout readouts
 *   cols 11–12 master transmit trigger  [ENTER]
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  americanToDecimal,
  expectedValue,
  formatAmerican,
  formatUsd,
  impliedProb,
  kellyFraction,
  type Selection,
} from "@/lib/mock-panoramic-data";
import { MagneticWrapper } from "@/components/motion/MagneticWrapper";

const KELLY_OPTIONS = [
  { value: 0.25, label: "0.25x" },
  { value: 0.5, label: "0.50x" },
  { value: 1, label: "1.00x" },
] as const;

/** Hard risk cap: no single leg may exceed this share of bankroll. */
const MAX_LEG_EXPOSURE = 0.05;
const DEFAULT_BANKROLL = 25_000;

const MARKET_LABEL: Record<Selection["market"], string> = { SPREAD: "SPREAD", ML: "MONEYLINE", TOTAL: "TOTAL" };
const LABEL = "font-mono text-[10px] uppercase tracking-[0.1em] text-[#8A99AD] lg:tracking-[0.2em]";
/** text-2xl (24px) at 1440px+, scaling down so 6-figure readouts never truncate in narrower bays. */
const READOUT = "font-mono text-[clamp(1rem,1.65vw,1.5rem)] font-semibold tabular-nums";

function sizeLeg(selection: Selection, bankroll: number, multiplier: number) {
  const fullKelly = kellyFraction(selection.modelProb, selection.price);
  const raw = Math.max(0, fullKelly * multiplier);
  const fraction = Math.min(raw, MAX_LEG_EXPOSURE);
  const stake = Math.round(bankroll * fraction);
  return {
    selection,
    capped: raw > MAX_LEG_EXPOSURE,
    stake,
    ev: stake * expectedValue(selection.modelProb, selection.price),
    payout: stake * americanToDecimal(selection.price),
    implied: impliedProb(selection.price),
  };
}

type TransmitState = { state: "idle" } | { state: "ack"; orderId: string; legs: number };

export interface ExecutionDockProps {
  selections: readonly Selection[];
  onRemove: (key: string) => void;
}

export function ExecutionDock({ selections, onRemove }: ExecutionDockProps) {
  const [multiplier, setMultiplier] = useState<number>(0.5);
  const [bankroll, setBankroll] = useState<number>(DEFAULT_BANKROLL);
  const [transmit, setTransmit] = useState<TransmitState>({ state: "idle" });
  const orderSeq = useRef(4101);
  const resetTimer = useRef<number | undefined>(undefined);

  const legs = selections.map((s) => sizeLeg(s, bankroll, multiplier));
  const totalStake = legs.reduce((a, l) => a + l.stake, 0);
  const totalEv = legs.reduce((a, l) => a + l.ev, 0);
  const totalPayout = legs.reduce((a, l) => a + l.payout, 0);
  const edgePct = totalStake > 0 ? totalEv / totalStake : 0;
  const canTransmit = totalStake > 0;

  const engage = useCallback(() => {
    if (!canTransmit) return;
    orderSeq.current += 1;
    setTransmit({ state: "ack", orderId: `ORD-${orderSeq.current}`, legs: selections.length });
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setTransmit({ state: "idle" }), 2600);
  }, [canTransmit, selections.length]);

  // [ENTER] — ignored while typing or when a control already owns Enter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat) return;
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest("input, textarea, select, button, a, [contenteditable='true']")) return;
      e.preventDefault();
      engage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engage]);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  return (
    <section
      aria-label="Execution dock"
      data-boot-anchor="dock"
      className="fixed right-0 bottom-0 left-0 z-50 grid h-32 grid-cols-6 grid-rows-[52px_minmax(0,1fr)] gap-px border-t border-[#162032] bg-[#162032] lg:h-24 lg:grid-cols-12 lg:grid-rows-1"
    >
      {/* ── Cols 1–2: system & bankroll bay ── */}
      <div className="col-span-6 flex min-w-0 flex-row items-center gap-2 bg-[#05080F] px-3 lg:col-span-2 lg:flex-col lg:items-stretch lg:justify-between lg:gap-0 lg:px-4 lg:py-2.5">
        <span className={`${LABEL} flex items-center gap-2 max-lg:hidden`}>
          <span aria-hidden className="eq-pulse size-1.5 bg-[#CCFF00]" />
          Allocator <span className="text-[#162032]">{"//"}</span> <span className="text-[#CCFF00]">Armed</span>
        </span>
        <label className="flex h-8 min-w-0 flex-1 items-stretch border border-[#162032] focus-within:border-[#FAFAFA] lg:h-7 lg:flex-none">
          <span className="flex items-center border-r border-[#162032] px-2 font-mono text-[9px] tracking-[0.16em] whitespace-nowrap text-[#8A99AD] uppercase">
            BR $
          </span>
          <input
            inputMode="numeric"
            aria-label="Bankroll in US dollars"
            value={bankroll.toLocaleString("en-US")}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
              setBankroll(digits ? Number(digits) : 0);
            }}
            className="w-full min-w-0 bg-transparent px-2 font-mono text-sm text-[#FAFAFA] tabular-nums outline-none"
          />
        </label>
        <div role="radiogroup" aria-label="Fractional Kelly" className="grid h-8 w-[156px] shrink-0 grid-cols-3 gap-px border border-[#162032] bg-[#162032] lg:h-6 lg:w-auto">
          {KELLY_OPTIONS.map((o) => {
            const on = multiplier === o.value;
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setMultiplier(o.value)}
                className={`rounded-none font-mono text-[10px] tabular-nums transition-none ${
                  on ? "bg-[#CCFF00] font-semibold text-[#05080F]" : "bg-[#05080F] text-[#8A99AD] hover:text-[#FAFAFA]"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Cols 3–7: active ticket strip ── */}
      <div className="hidden min-w-0 flex-col bg-[#05080F] lg:col-span-5 lg:flex">
        <div className={`${LABEL} flex h-6 shrink-0 items-center justify-between border-b border-[#162032] px-4`}>
          <span>Active Ticket Strip</span>
          <span className="tabular-nums">[{String(selections.length).padStart(2, "0")}] Legs</span>
        </div>
        <ul className="no-scrollbar flex min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
          {legs.length === 0 && (
            <li className="flex items-center px-4 font-mono text-[11px] tracking-[0.12em] text-[#475569] uppercase">
              No legs staged — select any price on a console
            </li>
          )}
          {legs.map((l) => (
            <li key={l.selection.key} className="flex w-60 shrink-0 items-stretch border-r border-[#162032]">
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3">
                <span className="truncate font-mono text-[10px] tracking-[0.14em] text-[#8A99AD] uppercase">
                  {l.selection.matchup}
                </span>
                <span className="truncate font-mono text-[12px] text-[#FAFAFA] uppercase">
                  {MARKET_LABEL[l.selection.market]} · {l.selection.label}
                </span>
                <span className="flex items-baseline gap-2 font-mono text-[11px] tabular-nums">
                  <span className="text-[#FAFAFA]">{formatAmerican(l.selection.price)}</span>
                  {l.stake > 0 ? (
                    <span className="text-[#475569]">{formatUsd(l.stake)}</span>
                  ) : (
                    <span className="text-[#FF00FF]">NO EDGE</span>
                  )}
                  {l.capped && <span className="text-[#FF00FF]">CAP</span>}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(l.selection.key)}
                aria-label={`Remove ${l.selection.label}`}
                className="w-9 shrink-0 rounded-none border-l border-[#162032] font-mono text-[11px] text-[#475569] transition-colors hover:bg-[#FF00FF] hover:text-[#FAFAFA]"
              >
                [X]
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Cols 8–10: risk & payout readouts ── */}
      <dl className="col-span-4 grid grid-cols-3 divide-x divide-[#162032] bg-[#05080F] lg:col-span-3">
        <div className="flex min-w-0 flex-col justify-between px-2 py-2.5 xl:px-3">
          <dt className={LABEL}>Rec. Stake</dt>
          <dd className={`${READOUT} truncate text-[#FAFAFA]`}>{formatUsd(totalStake)}</dd>
        </div>
        <div className="flex min-w-0 flex-col justify-between px-2 py-2.5 xl:px-3">
          <dt className={LABEL}>Comb. Edge</dt>
          <dd className={`${READOUT} truncate ${edgePct > 0 ? "text-[#CCFF00]" : "text-[#8A99AD]"}`}>
            {`${edgePct > 0 ? "+" : ""}${(edgePct * 100).toFixed(1)}%`}
          </dd>
        </div>
        <div className="flex min-w-0 flex-col justify-between px-2 py-2.5 xl:px-3">
          <dt className={LABEL}>Payout</dt>
          <dd className={`${READOUT} truncate text-[#FAFAFA]`}>{formatUsd(totalPayout)}</dd>
        </div>
      </dl>

      {/* ── Cols 11–12: master transmit trigger ── */}
      <div className="col-span-2 flex flex-col bg-[#05080F]">
        <button
          type="button"
          onClick={engage}
          disabled={!canTransmit}
          className="flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-none bg-[#CCFF00] font-mono text-[11px] font-bold tracking-[0.12em] text-[#05080F] uppercase transition-colors hover:bg-[#FAFAFA] lg:text-xs lg:tracking-[0.2em] disabled:cursor-not-allowed disabled:bg-[#162032] disabled:text-[#475569]"
        >
          {/* Structural CTA: the lime box is locked to the dock's 1px grid and
              never moves. Only the label floats; the whole button is the hit
              area (hitArea="parent") and overflow-hidden keeps the text off
              the hairlines. */}
          <MagneticWrapper hitArea="parent" maxPull={12} className="flex flex-col items-center gap-1">
            <span>Engage Order</span>
            <span aria-live="polite" className="text-[10px] font-semibold tracking-[0.12em] tabular-nums lg:tracking-[0.18em]">
              {transmit.state === "ack" ? (
                <>
                  ACK {transmit.orderId}
                  <span className="max-lg:hidden"> · {transmit.legs} LEG</span>
                </>
              ) : (
                <>
                  {/* Phones have no ticket strip and no Enter key: show the leg count. */}
                  <span className="lg:hidden">{String(selections.length).padStart(2, "0")} Legs</span>
                  <span className="max-lg:hidden">{"// [ENTER]"}</span>
                </>
              )}
            </span>
          </MagneticWrapper>
        </button>
      </div>
    </section>
  );
}

export default ExecutionDock;

"use client";

/**
 * MatchupConsole — one 80vw broadcast cockpit on the panoramic track.
 *
 * Asymmetrical 40 / 60 split (grid-cols-12 → 5 / 7):
 *   LEFT  — Campaign visual stage: luminosity-blended photography fused into
 *           the midnight canvas, bleed-off display team codes, and a crisp
 *           score / clock / venue lockup.
 *   RIGHT — 3× scale execution deck (72%) over a recessed telemetry
 *           sub-panel (28%).
 */

import Image from "next/image";
import { memo } from "react";
import { InteractiveOddsButton } from "@/components/command-center/InteractiveOddsButton";
import { DecodeText } from "@/components/motion/ZeroLatencyGlyphDecode";
import {
  MARKET_DATA,
  bestEdge,
  formatSpread,
  formatTotal,
  impliedProb,
  selectionByKey,
  type MarketKind,
  type MarketProfile,
  type MarketType,
  type Matchup,
  type Selection,
  type SelectionSide,
  type TeamSide,
} from "@/lib/mock-panoramic-data";
import { MARKET_TYPES } from "@/store/useAppStore";

function sel(m: Matchup, market: MarketKind, side: SelectionSide): Selection {
  const s = selectionByKey(`${m.id}:${market}:${side}`);
  if (!s) throw new Error(`Unknown selection ${m.id}:${market}:${side}`);
  return s;
}

const TELEMETRY_LABEL = "font-mono text-[10px] uppercase tracking-[0.22em] text-[#475569]";
const TELEMETRY_VALUE = "font-mono text-sm leading-snug tabular-nums";

export interface MatchupConsoleProps {
  matchup: Matchup;
  profile: MarketProfile;
  index: number;
  selectedKeys: ReadonlySet<string>;
  onToggleSelection: (selection: Selection) => void;
}

/* ── LEFT 40%: the editorial broadcast poster ──────────────────────────── */

function CampaignStage({ m, index }: { m: Matchup; index: number }) {
  const live = m.status.phase !== "PRE";
  const score = m.away.score === null || m.home.score === null ? "— : —" : `${m.away.score} — ${m.home.score}`;

  return (
    <div className="group relative col-span-5 h-[clamp(96px,18dvh,200px)] shrink-0 overflow-hidden bg-[#05080F] select-none [container-type:size] lg:h-auto">
      {/* Photography: every market's frame for this slot is mounted up front and
          toggled with `visibility`, so a market switch is a 0ms cut — no blank
          frame while a new image loads. */}
      {MARKET_TYPES.map((market: MarketType) => {
        const frame = MARKET_DATA[market].matchups[index];
        const on = market === m.league;
        // Local curated files (SOCCER) bypass the Unsplash loader entirely and are
        // URI-encoded so filenames with spaces stay valid in the src attribute.
        const local = frame.imageUrl.startsWith("/");
        return (
          <Image
            key={market}
            src={local ? encodeURI(frame.imageUrl) : frame.imageUrl}
            unoptimized={local}
            alt={on ? frame.imageCaption : ""}
            aria-hidden={!on}
            fill
            quality={85}
            sizes="(min-width: 1024px) 34vw, 100vw"
            className={`absolute inset-0 h-full w-full scale-105 object-cover object-center opacity-40 mix-blend-luminosity contrast-125 transition-transform duration-700 ease-out group-hover:scale-100 ${
              on ? "visible" : "invisible"
            }`}
          />
        );
      })}

      {/* Duotone vignette: fuses the plate into the #05080F canvas. */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#05080F] via-transparent to-[#05080F]/70" />

      {/* Display team codes (Runiga) at the original monumental size, pinned
          INSIDE the poster with ~2rem of clear space around the visible glyphs —
          no negative bleeds. (top-12 / mr-10 compensate for Runiga's capitals
          overshooting their 0.8 line box, so the ink sits ~32px from each edge.)
          Size = min(spec size, width cap, height cap) via container units on
          the poster, so the codes are full 12rem / 9rem wherever they fit and
          only shrink on tight posters instead of touching an edge, each other,
          or crossing the 1px hairline into the odds deck:
            width cap  (100cqw − 4rem) / 2.1    3-letter codes ≈ 2em wide + padding
            height cap (100cqh − 17rem) / 1.65  two 0.8em lines above the lockup */}
      <DecodeText
        as="div"
        text={m.away.code}
        index={0}
        className="font-display stroke-text pointer-events-none absolute top-3 left-4 text-[min(4.5rem,calc((100cqh_-_4.5rem)/0.95),calc((100cqw_-_3rem)/4.4))] lg:top-12 lg:left-8 lg:text-[min(9rem,calc((100cqw_-_4rem)/2.1),calc((100cqh_-_17rem)/1.65))] leading-[0.8] font-black tracking-[-0.03em] whitespace-nowrap text-[#FAFAFA]/15 xl:text-[min(12rem,calc((100cqw_-_4rem)/2.1),calc((100cqh_-_17rem)/1.65))]"
      />

      {/* Bottom stack: home code pinned right (~2rem visible padding) and always directly
          ABOVE the lockup, at any viewport height. */}
      <div className="absolute inset-x-0 bottom-3 flex flex-col lg:bottom-5">
        <DecodeText
          as="div"
          text={m.home.code}
          index={1}
          className="font-display pointer-events-none mr-4 mb-1.5 self-end text-[min(4.5rem,calc((100cqh_-_4.5rem)/0.95),calc((100cqw_-_3rem)/4.4))] lg:mr-10 lg:mb-6 lg:text-[min(9rem,calc((100cqw_-_4rem)/2.1),calc((100cqh_-_17rem)/1.65))] leading-[0.8] font-black tracking-[-0.03em] whitespace-nowrap text-[#CCFF00]/25 xl:text-[min(12rem,calc((100cqw_-_4rem)/2.1),calc((100cqh_-_17rem)/1.65))]"
        />

        {/* Foreground lockup: score, clock badge, venue telemetry */}
        <div className="mx-3 flex items-center gap-3 border border-[#162032] bg-[#05080F]/80 p-2.5 lg:mx-5 lg:block lg:p-4">
          <div className="contents lg:flex lg:items-center lg:justify-between lg:gap-3">
            <span className="bg-[#CCFF00] px-2.5 py-1 font-mono text-[11px] font-bold tracking-widest text-[#05080F] uppercase">
              <DecodeText text={live ? m.status.clock.replace("LIVE ", "") : m.status.clock} index={2} />
            </span>
            <span className="order-last ml-auto truncate font-mono text-[10px] tracking-[0.2em] text-[#8A99AD] uppercase lg:ml-0">{m.id}</span>
          </div>
          <DecodeText
            as="div"
            text={score}
            index={3}
            className="font-display text-3xl leading-[0.9] text-[#FAFAFA] tabular-nums lg:mt-3 lg:text-5xl xl:text-6xl"
          />
          <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-[#162032] pt-2 font-mono text-[10px] tracking-[0.18em] uppercase max-lg:hidden">
            <DecodeText text={m.broadcast} index={4} className="truncate text-[#8A99AD]" />
            <span className="shrink-0 text-[#475569]">{"//"} PLATE</span>
          </div>
          <DecodeText
            as="p"
            text={m.imageCaption}
            index={5}
            className="mt-1 truncate font-mono text-[9px] tracking-[0.18em] text-[#475569] uppercase max-lg:hidden"
          />
        </div>
      </div>
    </div>
  );
}

/* ── RIGHT 60%: execution rows ─────────────────────────────────────────── */

function TeamRow({
  m,
  team,
  side,
  profile,
  selectedKeys,
  onToggleSelection,
}: {
  m: Matchup;
  team: TeamSide;
  side: "AWAY" | "HOME";
  profile: MarketProfile;
  selectedKeys: ReadonlySet<string>;
  onToggleSelection: (selection: Selection) => void;
}) {
  const away = side === "AWAY";
  const spread = sel(m, "SPREAD", side);
  const ml = sel(m, "ML", side);
  const total = sel(m, "TOTAL", away ? "OVER" : "UNDER");
  // Keyed by market + game + column so stale odds never bleed across markets.
  const k = (col: string) => `${m.league}-${m.id}-${col}-${side}`;

  return (
    <div className="flex min-h-0 flex-col lg:grid lg:flex-1 lg:grid-cols-4 lg:divide-x lg:divide-[#162032]">
      {/* Below lg: a compact name/score strip above full-width odds thirds. */}
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-[#162032] px-4 py-2 lg:flex-col lg:items-stretch lg:justify-between lg:border-b-0 lg:px-5 lg:py-3.5">
        <span className="font-mono text-[10px] tracking-[0.2em] text-[#475569] uppercase max-lg:hidden">{away ? "Away" : "Home"}</span>
        <div className="min-w-0">
          <DecodeText as="div" text={team.name} index={0} className="text-sm leading-tight font-semibold text-[#FAFAFA]" />
          <DecodeText
            as="div"
            text={team.record}
            index={1}
            className="mt-1 font-mono text-[11px] tracking-widest text-[#8A99AD] tabular-nums"
          />
        </div>
        <DecodeText
          as="div"
          text={team.score === null ? "—" : String(team.score)}
          index={2}
          className="shrink-0 font-mono text-2xl font-light text-[#FAFAFA] tabular-nums lg:text-4xl xl:text-5xl"
        />
      </div>
      {/* lg:contents → on desktop the buttons join the parent 4-col grid. */}
      <div className="grid grid-cols-3 divide-x divide-[#162032] lg:contents">
      <InteractiveOddsButton
        key={k("spread")}
        selection={spread}
        label={profile.columns.spread}
        line={formatSpread(away ? m.spread.current : -m.spread.current)}
        selected={selectedKeys.has(spread.key)}
        onToggle={onToggleSelection}
        column={3}
      />
      <InteractiveOddsButton
        key={k("ml")}
        selection={ml}
        label={profile.columns.moneyline}
        selected={selectedKeys.has(ml.key)}
        onToggle={onToggleSelection}
        column={4}
      />
      <InteractiveOddsButton
        key={k("total")}
        selection={total}
        label={`${profile.columns.total} · ${away ? "Over" : "Under"}`}
        line={formatTotal(m.total.current)}
        selected={selectedKeys.has(total.key)}
        onToggle={onToggleSelection}
        column={5}
      />
      </div>
    </div>
  );
}

/* ── Console ───────────────────────────────────────────────────────────── */

function MatchupConsoleImpl({ matchup: m, profile, index, selectedKeys, onToggleSelection }: MatchupConsoleProps) {
  const ev = bestEdge(m);
  const live = m.status.phase !== "PRE";
  const trueP = m.model.awayWin;
  const bookP = impliedProb(m.moneyline.away);
  const clvMove = m.sharp.awaySpread - m.spread.open;
  const syndicate = m.handle.moneyAway - m.handle.ticketsAway >= 0.2;

  return (
    <article
      data-console
      data-index={index}
      aria-label={`${m.away.code} at ${m.home.code}`}
      className="relative flex max-h-full w-screen shrink-0 snap-center flex-col divide-y divide-[#162032] overflow-y-auto border-y border-[#162032] bg-[#0A101D] lg:grid lg:max-h-none lg:overflow-visible lg:h-[86%] lg:w-[80vw] lg:grid-cols-12 lg:divide-x lg:divide-y-0 lg:border"
    >
      <CampaignStage m={m} index={index} />

      <div className="col-span-7 flex min-w-0 flex-col justify-between bg-[#0A101D]">
        {/* ── Top 72%: status header + execution rows ── */}
        <div className="flex min-h-0 flex-col lg:h-[72%]">
          <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-[#162032] bg-[#05080F] px-4 font-mono lg:px-6 text-[11px] tracking-[0.16em] uppercase">
            <div className="flex min-w-0 items-center gap-3">
              <span aria-hidden className={`size-1.5 shrink-0 ${live ? "eq-pulse bg-[#CCFF00]" : "bg-[#475569]"}`} />
              <DecodeText text={`${m.id} // ${m.status.clock}`} index={0} className="truncate text-[#FAFAFA] tabular-nums" />
            </div>
            <span
              className={`shrink-0 border px-2 py-0.5 text-[10px] tracking-[0.18em] ${
                m.liquidity === "THIN BOOK" ? "border-[#FF00FF] text-[#FF00FF]" : "border-[#162032] text-[#8A99AD]"
              }`}
            >
              {m.liquidity}
            </span>
          </header>

          <div className="flex min-h-0 flex-1 flex-col divide-y divide-[#162032]">
            <TeamRow m={m} team={m.away} side="AWAY" profile={profile} selectedKeys={selectedKeys} onToggleSelection={onToggleSelection} />
            <TeamRow m={m} team={m.home} side="HOME" profile={profile} selectedKeys={selectedKeys} onToggleSelection={onToggleSelection} />
          </div>
        </div>

        {/* ── Bottom 28%: recessed telemetry ── */}
        {/* Deep telemetry is desktop-only: on phones it cannot fit without crushing. */}
        <div className="hidden h-[28%] flex-col justify-between border-t border-[#162032] bg-[#03050A] px-6 py-3.5 lg:flex">
          <span className={TELEMETRY_LABEL}>Deep Telemetry {"//"} Quantitative Signal Breakdown</span>
          <dl className="grid grid-cols-5 gap-4 divide-x divide-[#162032]">
            <div className="min-w-0">
              <dt className={TELEMETRY_LABEL}>EV Edge</dt>
              <DecodeText
                as="dd"
                text={`${ev > 0 ? "+" : ""}${(ev * 100).toFixed(1)}%`}
                index={0}
                className={`mt-1.5 ${TELEMETRY_VALUE} ${ev > 0 ? "text-[#CCFF00]" : "text-[#FF00FF]"}`}
              />
            </div>
            <div className="min-w-0 pl-4">
              <dt className={TELEMETRY_LABEL}>CLV Delta</dt>
              <DecodeText
                as="dd"
                text={`${formatSpread(m.spread.open)} → ${m.sharp.book} ${formatSpread(m.sharp.awaySpread)}`}
                index={1}
                className={`mt-1.5 ${TELEMETRY_VALUE} ${clvMove === 0 ? "text-[#8A99AD]" : "text-[#FAFAFA]"}`}
              />
            </div>
            <div className="min-w-0 pl-4">
              <dt className={TELEMETRY_LABEL}>Handle Split</dt>
              <dd className="mt-2">
                <div
                  className="flex h-1 w-full bg-[#162032]"
                  title={`${Math.round(m.handle.moneyAway * 100)}% of money vs ${Math.round(m.handle.ticketsAway * 100)}% of tickets on ${m.away.code}`}
                >
                  <div
                    className={`h-full ${syndicate ? "bg-[#FF00FF]" : "bg-[#FAFAFA]"}`}
                    style={{ width: `${m.handle.moneyAway * 100}%` }}
                  />
                </div>
                <DecodeText
                  as="div"
                  text={`${Math.round(m.handle.moneyAway * 100)}% $ / ${Math.round(m.handle.ticketsAway * 100)}% TKT ${m.away.code}`}
                  index={2}
                  className={`mt-1.5 font-mono text-[11px] leading-snug tabular-nums ${syndicate ? "text-[#FF00FF]" : "text-[#8A99AD]"}`}
                />
              </dd>
            </div>
            <div className="min-w-0 pl-4">
              <dt className={TELEMETRY_LABEL}>True Prob</dt>
              <DecodeText
                as="dd"
                text={`${(trueP * 100).toFixed(1)}% v ${(bookP * 100).toFixed(1)}%`}
                index={3}
                className={`mt-1.5 ${TELEMETRY_VALUE} ${trueP > bookP ? "text-[#CCFF00]" : "text-[#8A99AD]"}`}
              />
            </div>
            <div className="min-w-0 pl-4">
              <dt className={TELEMETRY_LABEL}>Efficiency</dt>
              <DecodeText as="dd" text={m.keyEfficiency} index={4} className={`mt-1.5 ${TELEMETRY_VALUE} text-[#8A99AD]`} />
            </div>
          </dl>
        </div>
      </div>
    </article>
  );
}

export const MatchupConsole = memo(MatchupConsoleImpl);
MatchupConsole.displayName = "MatchupConsole";

export default MatchupConsole;

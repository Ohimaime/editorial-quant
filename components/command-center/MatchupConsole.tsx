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
 *
 * Below lg the default view is only: photo poster (display codes + score
 * lockup) and the two odds rows (team code | SPREAD | ML | TOTAL). The status
 * header, team names/records, tick/EV micro-rows and Deep Telemetry fold into
 * a "VIEW TELEMETRY" accordion at the foot of the console.
 */

import Image from "next/image";
import { memo, useId, useRef, useState } from "react";
import { ConsoleArrow } from "@/components/command-center/ConsoleArrow";
import { InteractiveOddsButton } from "@/components/command-center/InteractiveOddsButton";
import { DecodeText } from "@/components/motion/ZeroLatencyGlyphDecode";
import {
  CONSOLE_COUNT,
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
    <div className="group relative col-span-5 h-[clamp(96px,calc(100dvh-460px),45dvh)] shrink-0 overflow-hidden bg-[#05080F] select-none [container-type:size] lg:h-auto">
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

      {/* Tablet (md → lg): consoles are full-width, so the step arrows live on the
          poster's vertical centre, clear of the odds deck. Index is static per
          console, so no store subscription is needed. */}
      <ConsoleArrow dir={-1} disabled={index === 0} className="absolute top-1/2 left-3 hidden -translate-y-1/2 md:flex lg:hidden" />
      <ConsoleArrow dir={1} disabled={index === CONSOLE_COUNT - 1} className="absolute top-1/2 right-3 hidden -translate-y-1/2 md:flex lg:hidden" />

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
    <div className="grid min-h-0 grid-cols-[3.5rem_repeat(3,minmax(0,1fr))] divide-x divide-[#162032] lg:flex-1 lg:grid-cols-4">
      {/* Below lg: a narrow team-code column; from lg: the full name/record/score strip. */}
      <div className="flex min-w-0 flex-col items-center justify-center lg:items-stretch lg:justify-between lg:px-5 lg:py-3.5">
        <DecodeText
          as="div"
          text={team.code}
          index={0}
          className={`font-display text-xl leading-none lg:hidden ${away ? "text-[#FAFAFA]" : "text-[#CCFF00]"}`}
        />
        <span className="font-mono text-[10px] tracking-[0.2em] text-[#475569] uppercase max-lg:hidden">{away ? "Away" : "Home"}</span>
        <div className="min-w-0 max-lg:hidden">
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
          className="shrink-0 font-mono font-light text-[#FAFAFA] tabular-nums max-lg:hidden lg:text-4xl xl:text-5xl"
        />
      </div>
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

  // Mobile-only accordion (discrete UI event; never touched by ticks).
  const [telemetryOpen, setTelemetryOpen] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const telemetryId = useId();
  const toggleTelemetry = () => {
    const next = !telemetryOpen;
    setTelemetryOpen(next);
    // Bring the expanded panel into the console's own (vertical) viewport.
    if (next) requestAnimationFrame(() => articleRef.current?.scrollTo({ top: articleRef.current.scrollHeight, behavior: "smooth" }));
  };

  return (
    <article
      ref={articleRef}
      data-console
      data-index={index}
      aria-label={`${m.away.code} at ${m.home.code}`}
      className="relative flex max-h-full w-screen shrink-0 snap-center flex-col divide-y divide-[#162032] overflow-y-auto border-y border-[#162032] bg-[#0A101D] lg:grid lg:max-h-none lg:overflow-visible lg:h-[86%] lg:w-[80vw] lg:grid-cols-12 lg:divide-x lg:divide-y-0 lg:border"
    >
      <CampaignStage m={m} index={index} />

      <div className="col-span-7 flex min-w-0 flex-col justify-between bg-[#0A101D]">
        {/* ── Top 72%: status header + execution rows ── */}
        <div className="flex min-h-0 flex-col lg:h-[72%]">
          <header className="hidden h-11 shrink-0 items-center justify-between gap-3 border-b border-[#162032] bg-[#05080F] px-4 font-mono lg:flex lg:px-6 text-[11px] tracking-[0.16em] uppercase">
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

        {/* ── Below lg: VIEW TELEMETRY accordion toggle ── */}
        <button
          type="button"
          onClick={toggleTelemetry}
          aria-expanded={telemetryOpen}
          aria-controls={telemetryId}
          className={`flex h-11 shrink-0 items-center justify-between border-t border-[#162032] px-4 font-mono text-[10px] tracking-[0.22em] uppercase lg:hidden ${
            telemetryOpen ? "bg-[#162032] text-[#CCFF00]" : "bg-[#05080F] text-[#8A99AD]"
          }`}
        >
          <span>{telemetryOpen ? "[ − ] Hide Telemetry" : "[ + ] View Telemetry"}</span>
          <span className={ev > 0 ? "text-[#CCFF00]" : "text-[#475569]"}>{ev > 0 ? `+${(ev * 100).toFixed(1)}% EV` : "05 Signals"}</span>
        </button>

        {/* ── Bottom 28%: recessed telemetry (always on lg; accordion body below lg) ── */}
        <div
          id={telemetryId}
          className={`${telemetryOpen ? "flex" : "hidden"} flex-col gap-4 border-t border-[#162032] bg-[#03050A] px-4 py-4 lg:flex lg:h-[28%] lg:justify-between lg:gap-0 lg:px-6 lg:py-3.5`}
        >
          <span className={TELEMETRY_LABEL}>Deep Telemetry {"//"} Quantitative Signal Breakdown</span>

          {/* Mobile-only context the default view drops: game status + full team names. */}
          <div className="space-y-2 border-b border-[#162032] pb-3 lg:hidden">
            <div className="flex items-center justify-between gap-3 font-mono text-[10px] tracking-[0.16em] uppercase">
              <DecodeText text={`${m.id} // ${m.status.clock}`} index={0} className="truncate text-[#FAFAFA] tabular-nums" />
              <span className={`shrink-0 border px-2 py-0.5 ${m.liquidity === "THIN BOOK" ? "border-[#FF00FF] text-[#FF00FF]" : "border-[#162032] text-[#8A99AD]"}`}>
                {m.liquidity}
              </span>
            </div>
            {[m.away, m.home].map((t, i) => (
              <div key={i} className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-semibold text-[#FAFAFA]">
                  <span className="mr-2 font-mono text-[10px] tracking-[0.2em] text-[#475569]">{i === 0 ? "AWY" : "HME"}</span>
                  {t.name}
                </span>
                <span className="shrink-0 font-mono text-[11px] tracking-widest text-[#8A99AD] tabular-nums">{t.record}</span>
              </div>
            ))}
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-5 lg:gap-y-0 lg:divide-x lg:divide-[#162032]">
            <div className="min-w-0">
              <dt className={TELEMETRY_LABEL}>EV Edge</dt>
              <DecodeText
                as="dd"
                text={`${ev > 0 ? "+" : ""}${(ev * 100).toFixed(1)}%`}
                index={0}
                className={`mt-1.5 ${TELEMETRY_VALUE} ${ev > 0 ? "text-[#CCFF00]" : "text-[#FF00FF]"}`}
              />
            </div>
            <div className="min-w-0 lg:pl-4">
              <dt className={TELEMETRY_LABEL}>CLV Delta</dt>
              <DecodeText
                as="dd"
                text={`${formatSpread(m.spread.open)} → ${m.sharp.book} ${formatSpread(m.sharp.awaySpread)}`}
                index={1}
                className={`mt-1.5 ${TELEMETRY_VALUE} ${clvMove === 0 ? "text-[#8A99AD]" : "text-[#FAFAFA]"}`}
              />
            </div>
            <div className="min-w-0 lg:pl-4">
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
            <div className="min-w-0 lg:pl-4">
              <dt className={TELEMETRY_LABEL}>True Prob</dt>
              <DecodeText
                as="dd"
                text={`${(trueP * 100).toFixed(1)}% v ${(bookP * 100).toFixed(1)}%`}
                index={3}
                className={`mt-1.5 ${TELEMETRY_VALUE} ${trueP > bookP ? "text-[#CCFF00]" : "text-[#8A99AD]"}`}
              />
            </div>
            <div className="col-span-2 min-w-0 lg:col-span-1 lg:pl-4">
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

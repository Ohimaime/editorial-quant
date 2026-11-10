/**
 * Panoramic Command Center — mock multi-market telemetry.
 *
 * All prices are American odds; probabilities are 0–1 decimals. Spread lines
 * are expressed from the AWAY side's perspective (−4.5 = away lays 4.5).
 * SOCCER uses Asian Handicap (spread), Draw No Bet (moneyline, 2-way) and
 * goal totals, mapped onto the same `Matchup` interface.
 *
 * NBA / NFL imagery: Unsplash CDN URLs, each checked (HTTP 200) and reviewed on
 * a contact sheet — generic sport stock, NOT the named teams or venues. NFL has
 * one true American-football frame (NFL-01); the rest are floodlit stadiums.
 *
 * SOCCER imagery: curated local files in public/images/ (exact filenames, spaces
 * included — encoded at render time). These are match photos of the named
 * clubs from press agencies; license before any public/commercial use.
 *
 * `imageCaption` states literally what each frame shows (also its alt text).
 */

import type { MarketType } from "@/store/useAppStore";
import { impliedProbability } from "./market-sim";

export type { MarketType };
export type Phase = "LIVE" | "HALF" | "PRE";
export type MarketKind = "SPREAD" | "ML" | "TOTAL";
export type SelectionSide = "AWAY" | "HOME" | "OVER" | "UNDER";
export type Tone = "up" | "down" | "pin" | "flat";
export type Liquidity = "HIGH LIQUIDITY" | "MED LIQUIDITY" | "THIN BOOK";

export interface TeamSide {
  code: string;
  name: string;
  /** NBA/NFL "W-L", SOCCER "W-D-L" */
  record: string;
  score: number | null;
}

export interface Matchup {
  /** Console serial, e.g. "NBA-01" */
  id: string;
  league: MarketType;
  away: TeamSide;
  home: TeamSide;
  status: { phase: Phase; clock: string };
  /** "MSG NETWORK // NEW YORK" */
  broadcast: string;
  liquidity: Liquidity;
  spread: { open: number; current: number; awayPrice: number; homePrice: number };
  moneyline: { away: number; home: number };
  total: { current: number; overPrice: number; underPrice: number };
  /** Model (true) probabilities. SOCCER `awayWin` is the draw-no-bet probability. */
  model: { awayWin: number; awayCover: number; over: number };
  /** Sharp-book reference line for the away spread. */
  sharp: { book: "PIN" | "CIRCA"; awaySpread: number };
  /** Share of MONEY and of TICKETS on the away side. */
  handle: { moneyAway: number; ticketsAway: number };
  /** Sport-specific key efficiency delta (away − home). */
  keyEfficiency: string;
  /** Campaign photography: an Unsplash CDN URL, or a site-relative local path ("/images/…"). */
  imageUrl: string;
  /** Literal description of what the photograph shows (also its alt text). */
  imageCaption: string;
}

export interface Selection {
  key: string;
  gameId: string;
  matchup: string;
  market: MarketKind;
  side: SelectionSide;
  label: string;
  price: number;
  modelProb: number;
}

export interface TickerItem {
  id: string;
  sym: string;
  text: string;
  delta: string;
  tone: Tone;
}

export interface MarketProfile {
  columns: { spread: string; moneyline: string; total: string };
  mlSuffix: string;
  totalUnit: string;
}

export interface MarketData {
  profile: MarketProfile;
  matchups: Matchup[];
  ticker: TickerItem[];
}

/** Canonical Unsplash URL with the broadcast crop parameters. */
export function unsplash(photoId: string): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1400&q=85`;
}

const team = (code: string, name: string, record: string, score: number | null = null): TeamSide => ({
  code,
  name,
  record,
  score,
});

/* -------------------------------------------------------------------------- */
/*                                     NBA                                    */
/* -------------------------------------------------------------------------- */

const NBA: Matchup[] = [
  {
    id: "NBA-01",
    league: "NBA",
    away: team("BOS", "Boston Celtics", "8-3", 88),
    home: team("NYK", "New York Knicks", "7-4", 84),
    status: { phase: "LIVE", clock: "LIVE Q3 04:12" },
    broadcast: "MSG NETWORK // NEW YORK",
    liquidity: "HIGH LIQUIDITY",
    spread: { open: -2.5, current: -4.5, awayPrice: -105, homePrice: -115 },
    moneyline: { away: -188, home: 158 },
    total: { current: 224.5, overPrice: -112, underPrice: -108 },
    model: { awayWin: 0.684, awayCover: 0.548, over: 0.521 },
    sharp: { book: "PIN", awaySpread: -5.0 },
    handle: { moneyAway: 0.67, ticketsAway: 0.41 },
    keyEfficiency: "NET RTG +5.9 / PACE 97.0",
    imageUrl: unsplash("1505666287802-931dc83948e9"),
    imageCaption: "INDOOR GAME UNDER GYMNASIUM LIGHTS",
  },
  {
    id: "NBA-02",
    league: "NBA",
    away: team("OKC", "Oklahoma City Thunder", "10-1", 61),
    home: team("DEN", "Denver Nuggets", "8-3", 59),
    status: { phase: "HALF", clock: "HALFTIME" },
    broadcast: "PRIME VIDEO // DENVER",
    liquidity: "HIGH LIQUIDITY",
    spread: { open: 1.5, current: -1.5, awayPrice: -110, homePrice: -110 },
    moneyline: { away: -126, home: 106 },
    total: { current: 227.0, overPrice: -105, underPrice: -115 },
    model: { awayWin: 0.571, awayCover: 0.519, over: 0.474 },
    sharp: { book: "CIRCA", awaySpread: -2.0 },
    handle: { moneyAway: 0.72, ticketsAway: 0.58 },
    keyEfficiency: "NET RTG +9.6 / PACE 99.3",
    imageUrl: unsplash("1504450758481-7338eba7524a"),
    imageCaption: "PACKED ARENA BOWL UNDER BROADCAST LIGHTING",
  },
  {
    id: "NBA-03",
    league: "NBA",
    away: team("MIL", "Milwaukee Bucks", "5-6", 88),
    home: team("PHI", "Philadelphia 76ers", "6-5", 91),
    status: { phase: "LIVE", clock: "LIVE Q4 09:47" },
    broadcast: "ESPN // PHILADELPHIA",
    liquidity: "MED LIQUIDITY",
    spread: { open: 1.0, current: 2.5, awayPrice: -110, homePrice: -110 },
    moneyline: { away: 132, home: -156 },
    total: { current: 230.5, overPrice: -110, underPrice: -110 },
    model: { awayWin: 0.402, awayCover: 0.531, over: 0.462 },
    sharp: { book: "PIN", awaySpread: 2.5 },
    handle: { moneyAway: 0.48, ticketsAway: 0.63 },
    keyEfficiency: "NET RTG −1.2 / PACE 97.4",
    imageUrl: unsplash("1608245449230-4ac19066d2d0"),
    imageCaption: "PLAYER RISING FOR A DUNK IN A DARK GYM",
  },
  {
    id: "NBA-04",
    league: "NBA",
    away: team("LAL", "Los Angeles Lakers", "7-4"),
    home: team("PHX", "Phoenix Suns", "4-7"),
    status: { phase: "PRE", clock: "PRE-MKT 22:00 ET" },
    broadcast: "NBC // PHOENIX",
    liquidity: "HIGH LIQUIDITY",
    spread: { open: 3.5, current: 3.0, awayPrice: -110, homePrice: -110 },
    moneyline: { away: 128, home: -150 },
    total: { current: 233.0, overPrice: -110, underPrice: -110 },
    model: { awayWin: 0.431, awayCover: 0.506, over: 0.509 },
    sharp: { book: "PIN", awaySpread: 3.0 },
    handle: { moneyAway: 0.55, ticketsAway: 0.71 },
    keyEfficiency: "NET RTG −0.3 / PACE 99.7",
    imageUrl: unsplash("1546519638-68e109498ffc"),
    imageCaption: "BALL DROPPING THROUGH THE NET, ARENA DARK",
  },
  {
    id: "NBA-05",
    league: "NBA",
    away: team("DAL", "Dallas Mavericks", "6-5", 52),
    home: team("MIN", "Minnesota Timberwolves", "7-4", 49),
    status: { phase: "LIVE", clock: "LIVE Q2 01:38" },
    broadcast: "PRIME VIDEO // MINNEAPOLIS",
    liquidity: "MED LIQUIDITY",
    spread: { open: 4.5, current: 3.5, awayPrice: -108, homePrice: -112 },
    moneyline: { away: 140, home: -165 },
    total: { current: 214.5, overPrice: -110, underPrice: -110 },
    model: { awayWin: 0.444, awayCover: 0.535, over: 0.441 },
    sharp: { book: "CIRCA", awaySpread: 3.0 },
    handle: { moneyAway: 0.29, ticketsAway: 0.37 },
    keyEfficiency: "NET RTG −3.2 / PACE 97.4",
    imageUrl: unsplash("1577471488278-16eec37ffcc2"),
    imageCaption: "DUNK OVER DEFENDERS, PRO INDOOR GAME",
  },
  {
    id: "NBA-06",
    league: "NBA",
    away: team("CLE", "Cleveland Cavaliers", "9-2"),
    home: team("ORL", "Orlando Magic", "6-5"),
    status: { phase: "PRE", clock: "PRE-MKT 19:00 ET" },
    broadcast: "NBA TV // ORLANDO",
    liquidity: "THIN BOOK",
    spread: { open: -3.0, current: -2.0, awayPrice: -110, homePrice: -110 },
    moneyline: { away: -132, home: 112 },
    total: { current: 212.5, overPrice: -108, underPrice: -112 },
    model: { awayWin: 0.548, awayCover: 0.472, over: 0.527 },
    sharp: { book: "PIN", awaySpread: -1.5 },
    handle: { moneyAway: 0.34, ticketsAway: 0.66 },
    keyEfficiency: "NET RTG +5.5 / PACE 96.2",
    imageUrl: unsplash("1544919982-b61976f0ba43"),
    imageCaption: "EMPTY COURT BEFORE THE DOORS OPEN",
  },
];

/* -------------------------------------------------------------------------- */
/*                                     NFL                                    */
/* -------------------------------------------------------------------------- */

const NFL: Matchup[] = [
  {
    id: "NFL-01",
    league: "NFL",
    away: team("KC", "Kansas City Chiefs", "6-3", 20),
    home: team("BUF", "Buffalo Bills", "7-2", 17),
    status: { phase: "LIVE", clock: "LIVE Q3 06:22" },
    broadcast: "CBS // ORCHARD PARK",
    liquidity: "HIGH LIQUIDITY",
    spread: { open: 2.5, current: 1.5, awayPrice: -110, homePrice: -110 },
    moneyline: { away: 105, home: -125 },
    total: { current: 49.5, overPrice: -110, underPrice: -110 },
    model: { awayWin: 0.505, awayCover: 0.538, over: 0.512 },
    sharp: { book: "PIN", awaySpread: 1.0 },
    handle: { moneyAway: 0.44, ticketsAway: 0.62 },
    keyEfficiency: "EPA/PLAY −0.024 / SR 47.9% v 49.6%",
    imageUrl: unsplash("1566577739112-5180d4bf9390"),
    imageCaption: "FOOTBALL ON THE YARD LINE, ARTIFICIAL TURF",
  },
  {
    id: "NFL-02",
    league: "NFL",
    away: team("SF", "San Francisco 49ers", "6-3", 14),
    home: team("DET", "Detroit Lions", "7-2", 10),
    status: { phase: "HALF", clock: "HALFTIME" },
    broadcast: "NBC SNF // DETROIT",
    liquidity: "HIGH LIQUIDITY",
    spread: { open: 2.5, current: 3.0, awayPrice: -118, homePrice: -102 },
    moneyline: { away: 136, home: -162 },
    total: { current: 51.5, overPrice: -110, underPrice: -110 },
    model: { awayWin: 0.41, awayCover: 0.556, over: 0.47 },
    sharp: { book: "CIRCA", awaySpread: 3.0 },
    handle: { moneyAway: 0.61, ticketsAway: 0.55 },
    keyEfficiency: "EPA/PLAY −0.047 / SR 47.1% v 50.3%",
    imageUrl: unsplash("1607627000458-210e8d2bdb1d"),
    imageCaption: "FLOODLIT FIELD WITH SIDELINE BROADCAST CAMERA",
  },
  {
    id: "NFL-03",
    league: "NFL",
    away: team("BAL", "Baltimore Ravens", "6-3", 27),
    home: team("CIN", "Cincinnati Bengals", "4-5", 24),
    status: { phase: "LIVE", clock: "LIVE Q4 11:05" },
    broadcast: "CBS // CINCINNATI",
    liquidity: "HIGH LIQUIDITY",
    spread: { open: -1.5, current: -2.5, awayPrice: -105, homePrice: -115 },
    moneyline: { away: -142, home: 120 },
    total: { current: 48.5, overPrice: -105, underPrice: -115 },
    model: { awayWin: 0.61, awayCover: 0.54, over: 0.44 },
    sharp: { book: "PIN", awaySpread: -2.5 },
    handle: { moneyAway: 0.71, ticketsAway: 0.58 },
    keyEfficiency: "EPA/PLAY +0.034 / SR 48.8% v 46.2%",
    imageUrl: unsplash("1489944440615-453fc2b6a9a9"),
    imageCaption: "NIGHT STADIUM BOWL UNDER FULL FLOODLIGHTS",
  },
  {
    id: "NFL-04",
    league: "NFL",
    away: team("PHI", "Philadelphia Eagles", "7-1"),
    home: team("DAL", "Dallas Cowboys", "3-6"),
    status: { phase: "PRE", clock: "PRE-MKT SUN 16:25 ET" },
    broadcast: "FOX // ARLINGTON",
    liquidity: "HIGH LIQUIDITY",
    spread: { open: -5.5, current: -6.5, awayPrice: -110, homePrice: -110 },
    moneyline: { away: -285, home: 235 },
    total: { current: 44.5, overPrice: -110, underPrice: -110 },
    model: { awayWin: 0.73, awayCover: 0.488, over: 0.497 },
    sharp: { book: "PIN", awaySpread: -6.5 },
    handle: { moneyAway: 0.66, ticketsAway: 0.78 },
    keyEfficiency: "EPA/PLAY +0.093 / SR 48.4% v 43.9%",
    imageUrl: unsplash("1504016798967-59a258e9386d"),
    imageCaption: "SOLD-OUT STADIUM FROM THE UPPER DECK",
  },
  {
    id: "NFL-05",
    league: "NFL",
    away: team("GB", "Green Bay Packers", "5-3-1", 3),
    home: team("HOU", "Houston Texans", "5-4", 7),
    status: { phase: "LIVE", clock: "LIVE Q1 02:47" },
    broadcast: "FOX // HOUSTON",
    liquidity: "MED LIQUIDITY",
    spread: { open: -1.0, current: 1.5, awayPrice: -108, homePrice: -112 },
    moneyline: { away: 102, home: -122 },
    total: { current: 47.5, overPrice: -110, underPrice: -110 },
    model: { awayWin: 0.52, awayCover: 0.55, over: 0.53 },
    sharp: { book: "CIRCA", awaySpread: 1.0 },
    handle: { moneyAway: 0.66, ticketsAway: 0.47 },
    keyEfficiency: "EPA/PLAY +0.024 / SR 47.6% v 45.8%",
    imageUrl: unsplash("1522778119026-d647f0596c20"),
    imageCaption: "FULL STADIUM DURING PLAY, UPPER STANDS",
  },
  {
    id: "NFL-06",
    league: "NFL",
    away: team("MIA", "Miami Dolphins", "4-5"),
    home: team("NYJ", "New York Jets", "2-7"),
    status: { phase: "PRE", clock: "PRE-MKT MON 20:15 ET" },
    broadcast: "ESPN MNF // EAST RUTHERFORD",
    liquidity: "MED LIQUIDITY",
    spread: { open: -3.0, current: -3.0, awayPrice: 100, homePrice: -120 },
    moneyline: { away: -150, home: 128 },
    total: { current: 44.5, overPrice: -110, underPrice: -110 },
    model: { awayWin: 0.585, awayCover: 0.49, over: 0.535 },
    sharp: { book: "PIN", awaySpread: -3.0 },
    handle: { moneyAway: 0.52, ticketsAway: 0.69 },
    keyEfficiency: "EPA/PLAY +0.055 / SR 45.1% v 42.7%",
    imageUrl: unsplash("1431324155629-1a6deb1dec8d"),
    imageCaption: "NIGHT FIELD UNDER A SINGLE LIGHT BANK",
  },
];

/* -------------------------------------------------------------------------- */
/*                                   SOCCER                                   */
/* -------------------------------------------------------------------------- */

const SOCCER: Matchup[] = [
  {
    id: "SOC-01",
    league: "SOCCER",
    away: team("ARS", "Arsenal", "8-2-1", 1),
    home: team("MCI", "Manchester City", "7-2-2", 1),
    status: { phase: "LIVE", clock: "LIVE 62'" },
    broadcast: "SKY SPORTS // MANCHESTER",
    liquidity: "HIGH LIQUIDITY",
    spread: { open: 0.5, current: 0.25, awayPrice: -105, homePrice: -115 },
    moneyline: { away: 128, home: -158 },
    total: { current: 2.5, overPrice: -125, underPrice: 105 },
    model: { awayWin: 0.46, awayCover: 0.53, over: 0.52 },
    sharp: { book: "PIN", awaySpread: 0.25 },
    handle: { moneyAway: 0.63, ticketsAway: 0.44 },
    keyEfficiency: "xG DIFF −0.14 / PPDA 8.6 v 9.1",
    imageUrl: "/images/arsenal vs man city.jpeg",
    imageCaption: "ARSENAL AND CITY PLAYERS JOSTLE AT A SET PIECE",
  },
  {
    id: "SOC-02",
    league: "SOCCER",
    away: team("RMA", "Real Madrid", "9-1-1", 1),
    home: team("BAR", "FC Barcelona", "8-2-1", 2),
    status: { phase: "HALF", clock: "HALFTIME" },
    broadcast: "ESPN+ // BARCELONA",
    liquidity: "HIGH LIQUIDITY",
    spread: { open: 0, current: 0.25, awayPrice: 102, homePrice: -122 },
    moneyline: { away: 118, home: -142 },
    total: { current: 3.0, overPrice: -108, underPrice: -112 },
    model: { awayWin: 0.47, awayCover: 0.515, over: 0.505 },
    sharp: { book: "CIRCA", awaySpread: 0.25 },
    handle: { moneyAway: 0.48, ticketsAway: 0.52 },
    keyEfficiency: "xG DIFF −0.26 / PPDA 10.4 v 7.9",
    imageUrl: "/images/madrid vs barca.jpeg",
    imageCaption: "BARÇA NO. 8 TUGS MADRID NO. 7'S SHIRT ON THE BREAK",
  },
  {
    id: "SOC-03",
    league: "SOCCER",
    away: team("BAY", "Bayern München", "10-1-0", 0),
    home: team("LEV", "Bayer Leverkusen", "6-3-2", 0),
    status: { phase: "LIVE", clock: "LIVE 17'" },
    broadcast: "SKY DE // LEVERKUSEN",
    liquidity: "MED LIQUIDITY",
    spread: { open: -0.25, current: -0.5, awayPrice: -102, homePrice: -118 },
    moneyline: { away: -175, home: 145 },
    total: { current: 3.0, overPrice: -120, underPrice: 100 },
    model: { awayWin: 0.66, awayCover: 0.535, over: 0.57 },
    sharp: { book: "PIN", awaySpread: -0.75 },
    handle: { moneyAway: 0.81, ticketsAway: 0.74 },
    keyEfficiency: "xG DIFF +0.57 / PPDA 7.2 v 9.4",
    imageUrl: "/images/bayern vs leverkusen.jpeg",
    imageCaption: "BAYERN CARRIES THE BALL THROUGH LEVERKUSEN'S PRESS",
  },
  {
    id: "SOC-04",
    league: "SOCCER",
    away: team("INT", "Inter", "7-2-2"),
    home: team("MIL", "AC Milan", "6-3-2"),
    status: { phase: "PRE", clock: "PRE-MKT SUN 20:45 CET" },
    broadcast: "DAZN // MILANO",
    liquidity: "MED LIQUIDITY",
    spread: { open: 0, current: -0.25, awayPrice: -110, homePrice: -110 },
    moneyline: { away: -135, home: 112 },
    total: { current: 2.5, overPrice: 105, underPrice: -125 },
    model: { awayWin: 0.565, awayCover: 0.47, over: 0.455 },
    sharp: { book: "PIN", awaySpread: -0.25 },
    handle: { moneyAway: 0.55, ticketsAway: 0.64 },
    keyEfficiency: "xG DIFF +0.26 / PPDA 9.8 v 11.2",
    imageUrl: "/images/ac milan vs inter milan.jpeg",
    imageCaption: "INTER AND MILAN CONTEST AN AERIAL DUEL",
  },
  {
    id: "SOC-05",
    league: "SOCCER",
    away: team("LIV", "Liverpool", "7-1-3", 1),
    home: team("CHE", "Chelsea", "6-3-2", 1),
    status: { phase: "LIVE", clock: "LIVE 78'" },
    broadcast: "SKY SPORTS // LONDON",
    liquidity: "HIGH LIQUIDITY",
    spread: { open: -0.25, current: 0.5, awayPrice: -175, homePrice: 145 },
    moneyline: { away: 150, home: -185 },
    total: { current: 2.5, overPrice: 210, underPrice: -270 },
    model: { awayWin: 0.41, awayCover: 0.66, over: 0.3 },
    sharp: { book: "CIRCA", awaySpread: 0.5 },
    handle: { moneyAway: 0.62, ticketsAway: 0.58 },
    keyEfficiency: "xG DIFF +0.35 / PPDA 8.1 v 9.6",
    imageUrl: "/images/liverpool vs chelsea .jpeg",
    imageCaption: "LIVERPOOL STRIKE AS CHELSEA LUNGE TO BLOCK",
  },
  {
    id: "SOC-06",
    league: "SOCCER",
    away: team("PSG", "Paris Saint-Germain", "8-3-0"),
    home: team("OM", "Olympique de Marseille", "6-2-3"),
    status: { phase: "PRE", clock: "PRE-MKT SUN 20:45 CET" },
    broadcast: "LIGUE 1+ // MARSEILLE",
    liquidity: "THIN BOOK",
    spread: { open: -1.0, current: -0.75, awayPrice: -105, homePrice: -115 },
    moneyline: { away: -260, home: 215 },
    total: { current: 3.0, overPrice: -115, underPrice: -105 },
    model: { awayWin: 0.74, awayCover: 0.535, over: 0.53 },
    sharp: { book: "PIN", awaySpread: -0.75 },
    handle: { moneyAway: 0.57, ticketsAway: 0.71 },
    keyEfficiency: "xG DIFF +0.90 / PPDA 7.4 v 10.7",
    imageUrl: "/images/psg vs marseille.jpeg",
    imageCaption: "PSG AND MARSEILLE PLAYERS CLASH ON THE PITCH",
  },
];

/* -------------------------------------------------------------------------- */
/*                             Marquee (line alerts)                          */
/* -------------------------------------------------------------------------- */

const NBA_TICKER: TickerItem[] = [
  { id: "nba-t01", sym: "BOS/NYK", text: "SPRD -2.5 → -4.5", delta: "▲ STEAM", tone: "down" },
  { id: "nba-t02", sym: "OKC/DEN", text: "ML +104 → -126", delta: "CLV +3.4%", tone: "up" },
  { id: "nba-t03", sym: "MIL/PHI", text: "TOT 226.0 → 230.5", delta: "+4.5 PTS", tone: "flat" },
  { id: "nba-t04", sym: "LAL/PHX", text: "SPRD +3.5 → +3.0", delta: "PIN SYNC", tone: "pin" },
  { id: "nba-t05", sym: "DAL/MIN", text: "TOT 218.5 → 214.5", delta: "▼ UNDER STEAM", tone: "down" },
  { id: "nba-t06", sym: "CLE/ORL", text: "ARB CIRCA/DK", delta: "+1.12% LOCK", tone: "pin" },
  { id: "nba-t07", sym: "BOS/NYK", text: "Q3 88-84", delta: "BOS RUN 9-2", tone: "up" },
  { id: "nba-t08", sym: "BOS/NYK", text: "MONEY 67% BOS", delta: "RLM", tone: "down" },
  { id: "nba-t09", sym: "OKC/DEN", text: "HALF 61-59", delta: "1H UNDER CASHED", tone: "up" },
  { id: "nba-t10", sym: "PACE", text: "LEAGUE 98.6 POSS", delta: "-0.8 VS 7D", tone: "flat" },
  { id: "nba-t11", sym: "INJ", text: "EMBIID Q → OUT", delta: "PHI -2.0", tone: "down" },
  { id: "nba-t12", sym: "CLV", text: "SEASON +2.31%", delta: "N=1,284", tone: "up" },
];

const NFL_TICKER: TickerItem[] = [
  { id: "nfl-t01", sym: "KC/BUF", text: "SPRD +2.5 → +1.5", delta: "THRU THE 2", tone: "flat" },
  { id: "nfl-t02", sym: "SF/DET", text: "SF +3 -110 → -118", delta: "▲ JUICE STEAM", tone: "down" },
  { id: "nfl-t03", sym: "BAL/CIN", text: "TOT 50.0 → 48.5", delta: "ARB 1.4%", tone: "pin" },
  { id: "nfl-t04", sym: "PHI/DAL", text: "SPRD -5.5 → -6.5", delta: "78% TKTS PHI", tone: "flat" },
  { id: "nfl-t05", sym: "GB/HOU", text: "SPRD -1.0 → +1.5", delta: "▼ FLIP PK", tone: "down" },
  { id: "nfl-t06", sym: "MIA/NYJ", text: "MIA -3 +100", delta: "PIN -3 +102", tone: "pin" },
  { id: "nfl-t07", sym: "KC/BUF", text: "Q3 20-17", delta: "KC TD DRIVE", tone: "up" },
  { id: "nfl-t08", sym: "WX", text: "BUF WIND 14 MPH", delta: "TOT -1.0", tone: "down" },
  { id: "nfl-t09", sym: "INJ", text: "HOU LT OUT", delta: "PRESS +3.1%", tone: "down" },
  { id: "nfl-t10", sym: "KEY#", text: "3 / 7 / 10 COVER", delta: "15.2% / 9.4%", tone: "flat" },
  { id: "nfl-t11", sym: "SF/DET", text: "1H SF +1.5", delta: "CASHED", tone: "up" },
  { id: "nfl-t12", sym: "CLV", text: "SEASON +2.87%", delta: "N=412", tone: "up" },
];

const SOCCER_TICKER: TickerItem[] = [
  { id: "soc-t01", sym: "ARS/MCI", text: "AH +0.50 → +0.25", delta: "▲ SYNDICATE", tone: "down" },
  { id: "soc-t02", sym: "RMA/BAR", text: "DNB +105 → +118", delta: "ARB 0.9%", tone: "pin" },
  { id: "soc-t03", sym: "BAY/LEV", text: "GOALS 2.75 → 3.0", delta: "+0.25", tone: "up" },
  { id: "soc-t04", sym: "INT/MIL", text: "AH 0 → -0.25", delta: "PIN SYNC", tone: "pin" },
  { id: "soc-t05", sym: "LIV/CHE", text: "U 2.5 -270", delta: "78' DECAY", tone: "flat" },
  { id: "soc-t06", sym: "PSG/OM", text: "AH -1.0 → -0.75", delta: "▼ DRIFT", tone: "down" },
  { id: "soc-t07", sym: "ARS/MCI", text: "62' 1-1", delta: "XG 1.12 – 0.97", tone: "flat" },
  { id: "soc-t08", sym: "BAY/LEV", text: "FIELD TILT 71%", delta: "XG 0.84", tone: "up" },
  { id: "soc-t09", sym: "RMA/BAR", text: "HT 1-2", delta: "BAR PRESS ↑", tone: "down" },
  { id: "soc-t10", sym: "PPDA", text: "LEAGUE AVG 10.2", delta: "-0.4 VS 7D", tone: "flat" },
  { id: "soc-t11", sym: "LINEUP", text: "MCI RODRI OUT", delta: "MCI -0.25", tone: "down" },
  { id: "soc-t12", sym: "CLV", text: "SEASON +1.94%", delta: "N=2,061", tone: "up" },
];

const PROFILES: Record<MarketType, MarketProfile> = {
  NBA: { columns: { spread: "Spread", moneyline: "Moneyline", total: "Total" }, mlSuffix: "ML", totalUnit: "PTS" },
  NFL: { columns: { spread: "Spread", moneyline: "Moneyline", total: "Total" }, mlSuffix: "ML", totalUnit: "PTS" },
  SOCCER: { columns: { spread: "Asian Hcp", moneyline: "Draw No Bet", total: "Goals" }, mlSuffix: "DNB", totalUnit: "GLS" },
};

export const MARKET_DATA: Record<MarketType, MarketData> = {
  NBA: { profile: PROFILES.NBA, matchups: NBA, ticker: NBA_TICKER },
  NFL: { profile: PROFILES.NFL, matchups: NFL, ticker: NFL_TICKER },
  SOCCER: { profile: PROFILES.SOCCER, matchups: SOCCER, ticker: SOCCER_TICKER },
};

/** O(1) dataset lookup; returned objects are referentially stable. */
export function getMarketData(market: MarketType): MarketData {
  return MARKET_DATA[market];
}

/** Every market publishes the same number of consoles → stable track geometry. */
export const CONSOLE_COUNT = NBA.length;

/* -------------------------------------------------------------------------- */
/*                               Pricing helpers                              */
/* -------------------------------------------------------------------------- */

export function americanToDecimal(price: number): number {
  return price > 0 ? 1 + price / 100 : 1 + 100 / Math.abs(price);
}

export const impliedProb = impliedProbability;

/** Expected value per $1 staked. */
export function expectedValue(prob: number, price: number): number {
  return prob * americanToDecimal(price) - 1;
}

/** Full-Kelly fraction of bankroll (negative → no bet). */
export function kellyFraction(prob: number, price: number): number {
  const b = americanToDecimal(price) - 1;
  return (b * prob - (1 - prob)) / b;
}

export function formatAmerican(price: number): string {
  return price > 0 ? `+${price}` : `${price}`;
}

/** Half-point lines print 1 dp (−4.5); quarter (Asian) lines print 2 dp (−0.75). */
function formatLine(value: number): string {
  return Number.isInteger(value * 2) ? value.toFixed(1) : value.toFixed(2);
}

export function formatSpread(line: number): string {
  if (line === 0) return "PK";
  return line > 0 ? `+${formatLine(line)}` : formatLine(line);
}

export function formatTotal(total: number): string {
  return formatLine(total);
}

export function formatUsd(value: number, digits = 0): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function matchupLabel(m: Matchup, sep = " @ "): string {
  return `${m.away.code}${sep}${m.home.code}`;
}

/* -------------------------------------------------------------------------- */
/*                                 Selections                                 */
/* -------------------------------------------------------------------------- */

export function getSelection(m: Matchup, market: MarketKind, side: SelectionSide): Selection {
  const base = { gameId: m.id, matchup: matchupLabel(m), market, side };
  const key = `${m.id}:${market}:${side}`;

  if (market === "SPREAD") {
    const away = side === "AWAY";
    return {
      ...base,
      key,
      label: `${away ? m.away.code : m.home.code} ${formatSpread(away ? m.spread.current : -m.spread.current)}`,
      price: away ? m.spread.awayPrice : m.spread.homePrice,
      modelProb: away ? m.model.awayCover : 1 - m.model.awayCover,
    };
  }
  if (market === "ML") {
    const away = side === "AWAY";
    return {
      ...base,
      key,
      label: `${away ? m.away.code : m.home.code} ${PROFILES[m.league].mlSuffix}`,
      price: away ? m.moneyline.away : m.moneyline.home,
      modelProb: away ? m.model.awayWin : 1 - m.model.awayWin,
    };
  }
  const over = side === "OVER";
  return {
    ...base,
    key,
    label: `${over ? "O" : "U"} ${formatTotal(m.total.current)}`,
    price: over ? m.total.overPrice : m.total.underPrice,
    modelProb: over ? m.model.over : 1 - m.model.over,
  };
}

export function allSelections(m: Matchup): Selection[] {
  return [
    getSelection(m, "SPREAD", "AWAY"),
    getSelection(m, "SPREAD", "HOME"),
    getSelection(m, "ML", "AWAY"),
    getSelection(m, "ML", "HOME"),
    getSelection(m, "TOTAL", "OVER"),
    getSelection(m, "TOTAL", "UNDER"),
  ];
}

export function bestSelection(m: Matchup): Selection {
  return allSelections(m).reduce((best, s) =>
    expectedValue(s.modelProb, s.price) > expectedValue(best.modelProb, best.price) ? s : best,
  );
}

export function bestEdge(m: Matchup): number {
  const s = bestSelection(m);
  return expectedValue(s.modelProb, s.price);
}

/** Every selection across every market, built once → referentially stable. */
const SELECTION_INDEX: Record<string, Selection> = Object.fromEntries(
  Object.values(MARKET_DATA)
    .flatMap((d) => d.matchups)
    .flatMap(allSelections)
    .map((s) => [s.key, s]),
);

export function selectionByKey(key: string): Selection | undefined {
  return SELECTION_INDEX[key];
}

/** One sharp position pre-staged in the execution dock. */
export const DEFAULT_SLIP_KEYS: string[] = ["NBA-01:SPREAD:AWAY"];

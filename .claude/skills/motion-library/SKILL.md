---
name: motion-library
description: Single source of truth for the Panoramic Command Center (High-Stakes Broadcast identity) motion architecture — WeightSweepMarquee (variable-font proximity alert ribbon), PanoramicSnapTrack (100vh-locked horizontal 80vw snap track with wheel→axis mapping), MagneticTelemetryCell + Tick Flash (InteractiveOddsButton), MagneticWrapper (overdamped spring pull for CTAs), ZeroLatencyGlyphDecode (0ms market swap + character decode), QuantCursor (dot → telemetry crosshair), and TerminalBootLoader (2.5s deterministic 3-tier boot), plus the QuantGlossary slide-over. Load before writing or changing any animated component, the status marquee, panoramic track, matchup console, odds button, execution dock, cursor, boot sequence, market switch, or anything under components/motion/ or components/command-center/.
---

# Motion Library — Panoramic Command Center (High-Stakes Broadcast)

Motion in this repository is **deterministic, frame-budgeted and typographic**. It
communicates telemetry state (focus, recency, price direction, which console is in the
glass), never decoration. Six patterns are canonical. Any new motion component must
either compose one of them or be added here first.

| Pattern | File | Engine | Drives |
|---|---|---|---|
| A. `WeightSweepMarquee` | `components/motion/WeightSweepMarquee.tsx` | Framer Motion `useAnimationFrame` + `useMotionValue` | `transform`, `font-variation-settings`, `font-weight`, `color` |
| B. `PanoramicSnapTrack` | `components/command-center/PanoramicTrack.tsx` | native CSS scroll-snap + `scrollTo` + `IntersectionObserver` | track `scrollLeft` |
| C. `MagneticTelemetryCell` (+ C.1 Tick Flash) | `components/motion/MagneticTelemetryCell.tsx`, `components/command-center/InteractiveOddsButton.tsx` | `gsap.quickTo` / GSAP timeline | payload `x`/`y`, flash-layer `opacity`, payload `color` |
| C.2 `MagneticWrapper` | `components/motion/MagneticWrapper.tsx` | Framer Motion `useMotionValue` + `useSpring` (overdamped) | wrapper `x`/`y` only |
| D. `ZeroLatencyGlyphDecode` | `components/motion/ZeroLatencyGlyphDecode.tsx` | rAF loop on the React-owned text node | text-node `nodeValue` only |
| E. `QuantCursor` | `components/motion/QuantCursor.tsx` | `gsap.quickTo` + zone-flip tweens | root `x`/`y`, arm `scaleX`/`scaleY`, reticle `scale` |
| F. `TerminalBootLoader` | `components/motion/TerminalBootLoader.tsx` | one 2.50s GSAP master timeline | `visibility`/`display` sets, hairline `scaleX`/`scaleY`, counter text |

### Broadcast palette (the only colours allowed in source)

| Token | Hex | Role |
|---|---|---|
| Deep Midnight | `#05080F` | base canvas; dark ink on lime fills |
| Broadcast Navy | `#0A101D` | console / module surface; odds-button rest surface |
| Abyssal Slate | `#03050A` | recessed telemetry |
| Midnight Hairline | `#162032` | every 1px structural border; hover surface |
| Titanium White | `#FAFAFA` | primary ink; ink on fuchsia flashes |
| Broadcast Silver | `#8A99AD` | secondary telemetry ink, micro-labels |
| Deep Steel | `#475569` | muted index ink; marquee rest ink |
| Electric Lime | `#CCFF00` | positive / active / +EV / selected / up-tick (always `#05080F` ink when filled) |
| Fuchsia | `#FF00FF` | negative delta / down-tick / alerts (THIN BOOK, NO EDGE, CAP, syndicate split) |

The legacy terminal palette (`#0A0A0A`, `#0D0D0D`, `#111111`, `#F5F5F0`, `#00E676`,
`#FF3300`, `#262626`) is banned. A grep across `app/ components/ lib/ store/` must return
nothing.

### Spatial contract (the layout every pattern assumes)

```
┌ Tier 1  TopStatusMarquee  h-12 (48px) ── market tabs │ CONSOLE 01/06 + pills │ WeightSweepMarquee ┐
├ Tier 2  PanoramicTrack    h-[calc(100vh-48px-96px)] ── px-[10vw] gap-8 snap-x snap-mandatory      ┤
│          ◂ 10vw ▸┌──────── MatchupConsole w-[80vw] h-[86%] snap-center ────────┐◂ peek ▸         │
│                  │ LEFT 5/12 poster  │ RIGHT 7/12: header 44px · AWAY · HOME     │                 │
│                  │ luminosity photo, │   (team | SPREAD | ML | TOTAL, 3×)  72%   │                 │
│                  │ bleed-off codes,  │ recessed #03050A telemetry (5 cols) 28%   │                 │
│                  │ score lockup      │                                           │                 │
│                  └───────────────────────────────────────────────────────────────┘                │
└ Tier 3  ExecutionDock     fixed bottom-0 h-24 (96px) ── grid-cols-12 instrument panel              ┘
```

The root is `h-dvh w-screen overflow-hidden flex flex-col` (dynamic viewport height, so
mobile browser chrome can't clip the dock), and `html, body` are `overflow: hidden`.
**The document never scrolls vertically.** All navigation is horizontal.

### Responsive degradation (single breakpoint: `lg` = 1024px)

Below `lg`, an 80vw console leaves ~90px per odds cell, which crushes 30px numerals even on
tablets, so the cockpit switches layout at `lg`, not `md`.

| Element | `< lg` (phones, tablets) | `≥ lg` (desktop) |
|---|---|---|
| Track | `px-0 gap-0`, height `100dvh − 48 − 128` | `px-[10vw] gap-8`, height `100dvh − 48 − 96` |
| Console | `w-screen`, `flex-col`: poster (`h-[clamp(96px,18dvh,200px)]`) on top, deck below; `max-h-full overflow-y-auto` guard | `w-[80vw] h-[86%]`, 40/60 `grid-cols-12` |
| Poster | display codes at `min(4.5rem, (100cqh − 4.5rem)/0.95, (100cqw − 3rem)/4.4)` (away top-left, home right above the lockup); one-row lockup (badge · score · id) | full poster with display codes |
| Team rows | name/score strip above full-width odds thirds (`lg:contents` wrapper) | 4-col row |
| Odds numerals | `text-2xl leading-none` | `text-3xl` → `xl:text-4xl` |
| Deep Telemetry | **hidden**: a swipeable matrix nested in the horizontal snap track would fight the console swipe | visible (28%) |
| Top bar | market tabs + `01 / 06`; pills and marquee hidden; `pr-12` reserves the glossary corner | full |
| Glossary trigger | 48×48 `?` in the top bar's right corner; panel = full-width sheet below the bar, scrolls | floating bottom-left, vertically centred in the console→dock gap; panel max-height + scroll |
| Dock | `h-32`, 2 rows: bankroll + Kelly / 3 readouts + ENGAGE (shows leg count); ticket strip hidden | `h-24`, 12 columns |

The dock draws its 1px grid with `gap-px` over a `#162032` base (children opaque), so the
same hairlines hold in both the 1-row and 2-row layouts. Verified at 375×667, 390×844,
820×1180, 1024×768 and 1440×900: no page overflow, the console fits its track, and no
numeral, dock or top-bar text overflows.

**Hydration:** `<html>` and `<body>` carry `suppressHydrationWarning` (it is one level
deep), because extensions such as Grammarly inject attributes before React hydrates.

## Global motion rules (apply to every pattern)

1. **No React state inside a loop.** Per-frame values live in refs / motion values and
   are written straight to the DOM. `useState` is allowed only for discrete events
   (a tick in its own leaf, "console changed"), and only when the value actually changes.
2. **No layout reads in the hot path.** Geometry is cached and refreshed by
   `ResizeObserver`, never by `getBoundingClientRect()` per frame. One rect read per
   pointer event on a non-transformed container is the maximum.
3. **Compositor-only properties for movement**: `transform` and `opacity`. Font-variation
   changes are permitted only on elements whose box size is reserved (Pattern A ghost layer).
4. **Cleanup is mandatory.** GSAP work goes through `useGSAP({ scope })`; rAF through
   `useAnimationFrame`; event-created tweens are killed on unmount.
5. **Respect `prefers-reduced-motion`.** Translation and decode halt; informational state
   changes (weight focus, flashes) remain because they carry meaning.
6. **Design constraints hold in every animated state**: 0px radius, `#162032` 1px
   hairlines, no shadows or blur. Depth is surface contrast (`#05080F` canvas and poster ·
   `#0A101D` console deck · `#03050A` recessed telemetry). The **only** gradient is the
   console poster's duotone vignette (`bg-gradient-to-t from-[#05080F] via-transparent
   to-[#05080F]/70`), which fuses the photograph into the canvas.
7. **No soft fades on data.** Market switches and the boot release are `0ms` cuts: no
   `opacity` tweens, no `transition-opacity`, no `AnimatePresence` on data. Motion on
   swapped data is the glyph decode (Pattern D) only. Photographs swap by `visibility`
   between pre-mounted layers, never by changing `src`. **Exception, UI chrome only:**
   the `QuantGlossary` slide-over (Pattern G) uses `AnimatePresence`.
8. **High-frequency state lives in leaves.** Ticks are local state inside memoized
   `InteractiveOddsButton`s. Consoles, the track and the page never re-render on a tick.
9. **Global lifecycle lives in the store.** `store/useAppStore.ts` (Zustand) owns `isBooted`,
   `activeMarket`, `activeConsoleIndex`, `consoleJump`, `marketSwitchTick`. Subscribe with
   narrow selectors only.
10. **Fonts must be variable where they animate.** Inter and JetBrains Mono load through
    `next/font/google` **without a `weight` option**. Re-measure after `document.fonts.ready`.

## Shared constants

| Constant | Value | Meaning |
|---|---|---|
| Tier 1 height | `48` | `TopStatusMarquee` (`h-12`) |
| Tier 3 height | `96` | `ExecutionDock` (`h-24`, `position: fixed`) |
| Console | `80vw × 86%` | `MatchupConsole`, `snap-center`, track `px-[10vw] gap-8` |
| `WHEEL_STEP` | `40` | Accumulated vertical wheel delta that advances one console |
| `WHEEL_COOLDOWN_MS` | `420` | Minimum interval between wheel-driven console steps |
| IO threshold | `0.6` | Intersection ratio at which a console counts as snapped |
| `SWEEP_RADIUS` (R) | `320` | Weight-sweep influence radius, px |
| `WGHT_MIN` / `WGHT_MAX` | `300` / `800` | Weight sweep range |
| `MAGNET_MAX_X` / `_Y` | `4` / `2.5` | Odds payload magnetic clamp, px |
| `FLASH_HOLD` / `FLASH_DECAY` | `0.15` / `0.45` | Tick flash timing, s |
| `TICK_PROBABILITY` | `0.15` | Per-cycle tick chance, 800–2500ms cycle (≈3 ticks/s board-wide) |
| `DECODE_DURATION_MS` | `140` | One element's glyph-decode burst |
| `DECODE_COLUMN_STAGGER_MS` | `8` | Decode start offset per column index |
| `BOOT_DURATION` | `2.5` | Boot timeline length, seconds, wall-clock exact |

---

## Pattern A — `WeightSweepMarquee`

### Concept

A continuous, seamless horizontal ticker. Each token interpolates its variable-font
weight between **300** and **800** according to its live horizontal distance from a
**focal point**:

- At rest: the viewport centre, `window.innerWidth / 2`.
- While hovered: the cursor, `event.clientX`.

Ink follows the same curve: `#8A99AD` at the periphery → `#FAFAFA` at the focal point,
or → `#FF00FF` (Swiss Vermilion) while the pointer is over the ticker.

### Falloff formula

Given focal point $X_f$, item centre $X_i$, influence radius $R = 320\text{px}$:

$$d = \min\left(1, \frac{|X_i - X_f|}{R}\right) \qquad \text{ease}(d) = (1 - d)^2 \qquad \text{wght} = \text{Math.round}(300 + 500 \cdot \text{ease}(d))$$

```ts
export function sweepWeight(itemX: number, focalX: number, radius = 320) {
  const d = Math.min(1, Math.abs(itemX - focalX) / radius);
  const ease = (1 - d) * (1 - d);
  return { ease, wght: Math.round(300 + 500 * ease) };
}
```

Quadratic ease-out gives a sharp, legible "lens" at the focal point and a long flat
tail at weight 300 — the editorial equivalent of a loupe over a tape.

### Frame pipeline (one `useAnimationFrame` tick)

```
tick(delta)
 ├─ speedScale ← lerp(speedScale, hovered ? 0.35 : 1, 0.08)      // eased slow-down on hover
 ├─ x ← x − speed·speedScale·min(delta, 64)/1000                    // clamp tab-switch jumps
 ├─ if x ≤ −halfWidth: x += halfWidth                                // seamless wrap at −50%
 ├─ track.style.transform = translate3d(x, 0, 0)
 └─ for each item i:
      X_i  = viewportLeft + cachedCenter[i] + x                     // virtual X, no layout read
      {ease, wght} = sweepWeight(X_i, focal ?? innerWidth/2)
      if wght changed → el.style.fontVariationSettings = "'wght' " + wght
                        el.style.fontWeight            = String(wght)
      if ink changed  → el.style.color = mix(#8A99AD → #FAFAFA|#FF00FF, ease)
```

### Implementation rules

| Rule | Why |
|---|---|
| Render `[...items, ...items]`; wrap when `x ≤ −track.scrollWidth / 2` | Second half is pixel-identical, so the wrap is invisible. |
| Put separators **inside** each item cell (padding, not `gap`) | Keeps both halves exactly equal width; a trailing `gap` breaks the wrap by 1 gap. |
| Cache `offsetLeft + offsetWidth / 2` per item; refresh only via `ResizeObserver` (+ `resize`, `document.fonts.ready`) | Zero layout thrash in the loop. `offsetParent` must be the track (`relative`). |
| **Ghost layer**: each cell is an `inline-grid` with an invisible copy of its content fixed at `wght 800` stacked in the same grid area | Cell width = max-weight width, so animating weight never reflows → cached centres stay valid and `halfWidth` never drifts. |
| Diff-write: keep `lastWght[i]` / `lastInk[i]`; skip identical writes | Most items sit at 300 most of the time; avoids ~90% of style writes. |
| Pointer handlers write refs only (`focalX`, `hovered`) | No re-render on `pointermove`. |
| Duplicated half is `aria-hidden` | Screen readers read the tape once. |
| `items` swap (market switch) → re-measure, clear the `lastWght`/`lastInk` diff caches, wrap with `x %= half` | New nodes start at the initial style, so a stale cache would skip their first write. A shorter new track can leave `x` beyond `−half`. |
| Track length ≥ 2× viewport width | Otherwise the right edge shows empty canvas before wrap. Add items or repeat further if needed. |
| `prefers-reduced-motion` → speed 0 | The weight lens still responds to the cursor. |

### Usage

```tsx
<WeightSweepMarquee
  items={ticker}
  getKey={(t) => t.id}
  renderItem={(t, ghost) => <TickerToken item={t} ghost={ghost} />}  // ghost: skip decode work
  separator={<span aria-hidden className="font-mono text-[11px] text-[#162032]">{"//"}</span>}
/>
```

Children inherit `font-variation-settings`, `font-weight` and `color` from the cell, so
mixed Inter / JetBrains Mono content sweeps together. Children that set their own
colour (e.g. green/red deltas) keep it — only weight sweeps on them.

### Reference implementation — `components/motion/WeightSweepMarquee.tsx`

```tsx
"use client";

/**
 * WeightSweepMarquee — Interaction Pattern A
 * Source of truth: .claude/skills/motion-library/SKILL.md
 *
 * A seamless horizontal ticker whose items interpolate their variable-font
 * weight (300 → 800) and ink (#475569 → #FAFAFA / #CCFF00) by proximity to a
 * focal point: the viewport centre at rest, the cursor X while hovered.
 *
 * Performance contract:
 *  - Zero React state in the loop. One `useAnimationFrame` tick translates the
 *    track and re-weights every item via direct DOM writes.
 *  - Item centres are cached from `offsetLeft` and refreshed only by a
 *    ResizeObserver, so the tick performs no layout reads.
 *  - Every item reserves its 800-weight width with an invisible ghost layer,
 *    so weight changes never reflow the track (cached offsets stay valid and
 *    the -50% wrap point stays exact).
 */

import { useAnimationFrame, useMotionValue } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

export const SWEEP_RADIUS = 320;
export const WGHT_MIN = 300;
export const WGHT_MAX = 800;

const INK_REST: RGB = [71, 85, 105]; // #475569 Deep Steel
const INK_FOCUS: RGB = [250, 250, 250]; // #FAFAFA Titanium White
const INK_HOT: RGB = [204, 255, 0]; // #CCFF00 Electric Lime (pointer focus)

type RGB = [number, number, number];

export interface WeightSweepMarqueeProps<T> {
  items: readonly T[];
  getKey: (item: T) => string;
  /** `ghost` is true for the invisible max-weight sizing copy — skip any animated work there. */
  renderItem: (item: T, ghost: boolean) => ReactNode;
  /** Base translation speed in px/s. */
  speed?: number;
  /** Influence radius R in px. */
  radius?: number;
  /** Speed multiplier while the pointer is over the track. */
  hoverSpeedFactor?: number;
  className?: string;
  /** Rendered between items (part of each item cell so both halves stay equal). */
  separator?: ReactNode;
}

/** d = min(1, |Xi − Xf| / R); ease = (1 − d)²; wght = round(300 + 500·ease) */
export function sweepWeight(itemX: number, focalX: number, radius = SWEEP_RADIUS) {
  const d = Math.min(1, Math.abs(itemX - focalX) / radius);
  const ease = (1 - d) * (1 - d);
  return { ease, wght: Math.round(WGHT_MIN + (WGHT_MAX - WGHT_MIN) * ease) };
}

function mix(a: RGB, b: RGB, t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

export function WeightSweepMarquee<T>({
  items,
  getKey,
  renderItem,
  speed = 48,
  radius = SWEEP_RADIUS,
  hoverSpeedFactor = 0.35,
  className = "",
  separator,
}: WeightSweepMarqueeProps<T>) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const itemEls = useRef<(HTMLElement | null)[]>([]);

  // Cached geometry — written only by the ResizeObserver.
  const centers = useRef<number[]>([]);
  const halfWidth = useRef(0);
  const viewportLeft = useRef(0);

  // Pointer / loop state — refs only, never React state.
  const focalX = useRef<number | null>(null);
  const hovered = useRef(false);
  const speedScale = useRef(1);
  const reducedMotion = useRef(false);
  const lastWght = useRef<number[]>([]);
  const lastInk = useRef<string[]>([]);

  const x = useMotionValue(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const measure = () => {
      // New item nodes (market switch) start at the SSR/initial style, so the
      // diff caches must be cleared or the first sweep write would be skipped.
      lastWght.current = [];
      lastInk.current = [];
      viewportLeft.current = viewport.getBoundingClientRect().left;
      halfWidth.current = track.scrollWidth / 2;
      centers.current = itemEls.current.map((el) =>
        el ? el.offsetLeft + el.offsetWidth / 2 : 0,
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    ro.observe(track);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPref = () => (reducedMotion.current = mq.matches);
    syncMotionPref();
    mq.addEventListener("change", syncMotionPref);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      mq.removeEventListener("change", syncMotionPref);
    };
  }, [items]);

  useAnimationFrame((_, delta) => {
    const track = trackRef.current;
    const half = halfWidth.current;
    if (!track || half === 0) return;

    // 1. Translation — eased speed, seamless wrap at -50%.
    const targetScale = hovered.current ? hoverSpeedFactor : 1;
    speedScale.current += (targetScale - speedScale.current) * 0.08;
    const v = reducedMotion.current ? 0 : speed * speedScale.current;

    let next = x.get() - (v * Math.min(delta, 64)) / 1000;
    // Modulo wrap: also correct when a dataset swap shrinks the track below |x|.
    if (next <= -half) next %= half;
    x.set(next);
    track.style.transform = `translate3d(${next}px, 0, 0)`;

    // 2. Weight sweep — virtual X from cached offsets, no layout reads.
    const focal = focalX.current ?? window.innerWidth / 2;
    const hot = hovered.current;
    const els = itemEls.current;
    const origin = viewportLeft.current + next;

    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (!el) continue;
      const { ease, wght } = sweepWeight(origin + centers.current[i], focal, radius);

      if (lastWght.current[i] !== wght) {
        el.style.fontVariationSettings = `'wght' ${wght}`;
        el.style.fontWeight = String(wght);
        lastWght.current[i] = wght;
      }

      const ink = mix(INK_REST, hot ? INK_HOT : INK_FOCUS, ease);
      if (lastInk.current[i] !== ink) {
        el.style.color = ink;
        lastInk.current[i] = ink;
      }
    }
  });

  const doubled = [...items, ...items];

  return (
    <div
      ref={viewportRef}
      className={`relative h-full min-w-0 flex-1 overflow-hidden ${className}`}
      onPointerEnter={() => (hovered.current = true)}
      onPointerMove={(e) => (focalX.current = e.clientX)}
      onPointerLeave={() => {
        hovered.current = false;
        focalX.current = null;
      }}
    >
      <div
        ref={trackRef}
        className="relative flex h-full w-max items-center will-change-transform"
      >
        {doubled.map((item, i) => {
          const content = (ghost: boolean) => (
            <>
              {renderItem(item, ghost)}
              {separator}
            </>
          );
          return (
            <span
              key={`${getKey(item)}-${i < items.length ? "a" : "b"}`}
              ref={(el) => {
                itemEls.current[i] = el;
              }}
              aria-hidden={i >= items.length || undefined}
              className="inline-grid h-full shrink-0 items-center whitespace-nowrap text-[#475569]"
              style={{ fontVariationSettings: `'wght' ${WGHT_MIN}`, fontWeight: WGHT_MIN }}
            >
              {/* Ghost layer reserves the 800-weight footprint → zero reflow. */}
              <span
                aria-hidden
                className="invisible col-start-1 row-start-1 flex items-center"
                style={{ fontVariationSettings: `'wght' ${WGHT_MAX}`, fontWeight: WGHT_MAX }}
              >
                {content(true)}
              </span>
              <span className="col-start-1 row-start-1 flex items-center justify-self-center">
                {content(false)}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default WeightSweepMarquee;
```

---

## Pattern B — `PanoramicSnapTrack`

### Concept

Six 80vw matchup consoles sit on a horizontal track inside a 100vh-locked cockpit. One
console is always centred "in the glass", and its neighbours peek in at 10vw on each
side. Every input device moves along the **horizontal axis only**, and every move lands
exactly on a console.

### Track

```tsx
<div
  ref={trackRef}
  data-cursor-zone="telemetry-grid"
  className="no-scrollbar flex h-[calc(100vh-48px-96px)] w-full shrink-0 snap-x snap-mandatory
             scroll-smooth items-center gap-8 overflow-x-auto overflow-y-hidden px-[10vw]"
>
  {matchups.map((m, i) => <MatchupConsole key={i} index={i} … />)}   {/* w-[80vw] h-[86%] snap-center */}
</div>
```

`no-scrollbar` is a Tailwind v4 `@utility` in `globals.css` (`scrollbar-width: none` plus
`::-webkit-scrollbar { display: none }`).

### Input mapping

| Input | Handling |
|---|---|
| Trackpad horizontal swipe, `Shift + Wheel` | Native: horizontal deltas pass through and `snap-mandatory` lands on a console. The handler returns early when `abs(deltaX) ≥ abs(deltaY)` or `shiftKey`. |
| Vertical mouse wheel | Native `wheel` listener with `{ passive: false }`: `preventDefault()`, accumulate `deltaY`, step **one console** once `abs(acc) ≥ WHEEL_STEP` (40), at most once per `WHEEL_COOLDOWN_MS` (420). The accumulator resets after 180ms of silence. |
| `←` / `→` | Window `keydown` → `jumpToConsole(active ± 1)` (ignored inside inputs). |
| Quick-jump pills `01`–`06` (Tier 1) | `jumpToConsole(i)` |

**Why not `scrollLeft += e.deltaY`:** under `snap-mandatory`, Chrome re-snaps after
every programmatic scroll. A ~100px wheel notch against a 1152px console resolves back
to the current console, so the wheel never advances. Accumulating and stepping is the
same intent ("the wheel pans the track") without fighting the snap. Verified: wheel
down, down, up → `02 → 03 → 02`.

### Store-driven navigation

`jumpToConsole(i)` writes `consoleJump = { index, seq: seq + 1 }`. The track subscribes and
calls `scrollToConsole`. `seq` makes repeated jumps to the same index still fire, and
keeps navigation requests out of React props.

```ts
export function scrollToConsole(track: HTMLElement, index: number, behavior: ScrollBehavior = "smooth") {
  const el = track.querySelector<HTMLElement>(`[data-console][data-index="${index}"]`);
  if (!el) return;
  track.scrollTo({ left: el.offsetLeft - (track.clientWidth - el.clientWidth) / 2, behavior });
}
```

Centring from `offsetLeft` (not `index × consoleWidth`) accounts for the `px-[10vw]`
padding and `gap-8`. Verified: the `06` pill lands with the console centre exactly on
the track centre (0px error).

### Snapped-console detection

One `IntersectionObserver` with `{ root: track, threshold: 0.6 }` observes every console
and calls `setActiveConsoleIndex(dataset.index)` when `intersectionRatio ≥ 0.6`. The
centred console is ~100% visible and its neighbours ~8%, so there's never ambiguity.
Consoles are keyed by position, so the observer is attached once.

### Market switches

Consoles are keyed by **position**: a market switch swaps data inside the same six
consoles in one commit. The track never jumps, the snapped console stays put, and
`activeConsoleIndex` is preserved across markets. Odds buttons inside are keyed
`${market}-${gameId}-${column}-${side}`, so their tick state remounts and stale prices
never bleed across markets.

### Reference implementation — `components/command-center/PanoramicTrack.tsx`

```tsx
"use client";

/**
 * PanoramicTrack — Tier 2: the horizontal 80vw snap track.
 *
 * Navigation is strictly horizontal:
 *  - native trackpad swipe / Shift+Wheel (horizontal deltas pass straight through);
 *  - vertical mouse wheels are mapped onto the horizontal axis, one console per
 *    notch (see WHEEL_STEP) — raw `scrollLeft += deltaY` cannot work under
 *    `snap-mandatory`, because the browser re-snaps every sub-console nudge back
 *    to the current console;
 *  - ← / → arrow keys and the Tier 1 quick-jump pills (store `consoleJump`).
 * An IntersectionObserver (threshold 0.6) reports the snapped console.
 */

import { useEffect, useRef } from "react";
import { MatchupConsole } from "@/components/command-center/MatchupConsole";
import { CONSOLE_COUNT, getMarketData, type Selection } from "@/lib/mock-panoramic-data";
import { useAppStore } from "@/store/useAppStore";

/** Accumulated vertical wheel delta that advances one console. */
export const WHEEL_STEP = 40;
/** Minimum interval between wheel-driven console steps (one smooth scroll). */
export const WHEEL_COOLDOWN_MS = 420;
/** Accumulator resets after this much wheel silence. */
const WHEEL_IDLE_MS = 180;

const clamp = (i: number) => Math.max(0, Math.min(CONSOLE_COUNT - 1, i));

/** Scroll so console `index` is centred (matches `snap-center`). */
export function scrollToConsole(track: HTMLElement, index: number, behavior: ScrollBehavior = "smooth") {
  const el = track.querySelector<HTMLElement>(`[data-console][data-index="${index}"]`);
  if (!el) return;
  track.scrollTo({ left: el.offsetLeft - (track.clientWidth - el.clientWidth) / 2, behavior });
}

export interface PanoramicTrackProps {
  selectedKeys: ReadonlySet<string>;
  onToggleSelection: (selection: Selection) => void;
}

export function PanoramicTrack({ selectedKeys, onToggleSelection }: PanoramicTrackProps) {
  const market = useAppStore((s) => s.activeMarket);
  const consoleJump = useAppStore((s) => s.consoleJump);
  const { matchups, profile } = getMarketData(market);
  const trackRef = useRef<HTMLDivElement>(null);

  // ── Snapped-console detection ──
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) {
            useAppStore.getState().setActiveConsoleIndex(Number((e.target as HTMLElement).dataset.index));
          }
        }
      },
      { root: track, threshold: 0.6 },
    );
    track.querySelectorAll("[data-console]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // ── Quick-jump requests (Tier 1 pills, arrow keys) ──
  useEffect(() => {
    if (consoleJump.seq === 0 || !trackRef.current) return;
    scrollToConsole(trackRef.current, clamp(consoleJump.index));
  }, [consoleJump]);

  // ── Vertical wheel → horizontal console steps (non-passive to own the event) ──
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let acc = 0;
    let lastStep = 0;
    let lastWheel = 0;
    const onWheel = (e: WheelEvent) => {
      // Horizontal intent (trackpad swipe, Shift+Wheel): let native scroll + snap handle it.
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY) || e.shiftKey) return;
      e.preventDefault();
      const now = performance.now();
      if (now - lastWheel > WHEEL_IDLE_MS) acc = 0;
      lastWheel = now;
      acc += e.deltaY;
      if (Math.abs(acc) < WHEEL_STEP || now - lastStep < WHEEL_COOLDOWN_MS) return;
      const dir = Math.sign(acc);
      acc = 0;
      lastStep = now;
      const { activeConsoleIndex, jumpToConsole } = useAppStore.getState();
      const next = clamp(activeConsoleIndex + dir);
      if (next !== activeConsoleIndex) jumpToConsole(next);
    };
    track.addEventListener("wheel", onWheel, { passive: false });
    return () => track.removeEventListener("wheel", onWheel);
  }, []);

  // ── ← / → arrow keys ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault();
      const { activeConsoleIndex, jumpToConsole } = useAppStore.getState();
      jumpToConsole(clamp(activeConsoleIndex + (e.key === "ArrowRight" ? 1 : -1)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      ref={trackRef}
      data-cursor-zone="telemetry-grid"
      aria-label="Matchup consoles"
      className="no-scrollbar flex h-[calc(100dvh-48px-128px)] w-full shrink-0 snap-x snap-mandatory scroll-smooth items-center gap-0 overflow-x-auto overflow-y-hidden px-0 lg:h-[calc(100dvh-48px-96px)] lg:gap-8 lg:px-[10vw]"
    >
      {matchups.map((m, i) => (
        // Keyed by POSITION: a market switch swaps data inside the same console
        // in 0ms; the track never jumps and the snapped console stays put.
        <MatchupConsole
          key={i}
          index={i}
          matchup={m}
          profile={profile}
          selectedKeys={selectedKeys}
          onToggleSelection={onToggleSelection}
        />
      ))}
    </div>
  );
}

export default PanoramicTrack;
```

---

## Pattern C — `MagneticTelemetryCell`

> **Consumer:** every `InteractiveOddsButton` (Pattern C.1) calls `useMagneticPull` on its
> 3× numeric payload. The button's 1px divider grid never moves.

### Concept

Interactive telemetry cells in the odds matrix keep a **rigid, immovable 1px outer
border**. Only their inner numeric payload (the `<span>` holding the odds value and its
micro-indicators) gets a small, smooth magnetic pull toward the cursor on hover. The
grid lines stay fixed while the numbers lean toward the pointer.

### Kinematics

Relative to the cell's geometric centre `(centerX, centerY)`:

$$\Delta x = \text{clientX} - \text{centerX}, \qquad \Delta y = \text{clientY} - \text{centerY}$$

$$T_x = \text{clamp}\left(\frac{\Delta x}{\text{width}/2} \times 4,\ -4,\ 4\right) \qquad T_y = \text{clamp}\left(\frac{\Delta y}{\text{height}/2} \times 2.5,\ -2.5,\ 2.5\right)$$

```ts
export function magneticOffset(clientX: number, clientY: number, rect: DOMRect) {
  const dx = clientX - (rect.left + rect.width / 2);
  const dy = clientY - (rect.top + rect.height / 2);
  return {
    x: clamp((dx / (rect.width / 2)) * 4, -4, 4),
    y: clamp((dy / (rect.height / 2)) * 2.5, -2.5, 2.5),
  };
}
```

Normalising by half-width / half-height makes the pull **cell-shape independent**: the
payload reaches its clamp exactly at the cell edge whether the cell is 56px or 112px
wide. The asymmetric clamp (4px vs 2.5px) matches the cells' landscape aspect ratio.

### Motion contract

| Phase | Mechanism | Timing |
|---|---|---|
| Follow | `gsap.quickTo(payload, "x" \| "y")` created inside `useGSAP` | `0.18s power3.out` |
| Return (leave) | pause both `quickTo` tweens, then `gsap.to(payload, { x: 0, y: 0 })` | `0.25s expo.out` |
| Re-entry during return | kill the return tween, `xTo(x, currentX)` / `yTo(y, currentY)` | follow resumes from the live position, so nothing jumps |

`quickTo` can't change its duration or ease per call, so the return needs its own tween.
A separate tween with `overwrite: "auto"` would kill the `quickTo` internals. **Pausing**
them works instead: `tween.resetTo()` calls `play()` on its next use, and the explicit
`start` argument sends it out from wherever the return tween left the payload.

### Rules

| Rule | Why |
|---|---|
| **Zero `useState` on pointer move.** Handlers only read refs and call `quickTo`. | Pointer events can fire at up to 1000 Hz on gaming mice. |
| Container: `relative overflow-hidden` with stationary 1px borders. Only the payload is transformed. | Hairlines are fixed structure. A transformed border would blur or shimmer at sub-pixel offsets. |
| Read `getBoundingClientRect()` on the **container** once per move. | The container never transforms, so the read is cheap and always correct, even if the page scrolled under a stationary pointer. |
| Skip `pointerType === "touch"`; disable under `prefers-reduced-motion`. | No magnetic pull on touch or reduced-motion devices. |
| No springs. | Springs can overshoot. Clamped ease-outs can't. |
| Event-created tweens (the return) are killed in an unmount effect; `quickTo` tweens are reverted by `useGSAP`. | Avoids tweens that outlive the component and target a detached node. |
| Handlers are plain functions, not `contextSafe(...)`. | The React Compiler lint (`react-hooks/refs`) flags `contextSafe` callbacks that close over refs as "ref read during render". |

### Reference implementation — `components/motion/MagneticTelemetryCell.tsx`

```tsx
"use client";

/**
 * MagneticTelemetryCell — Interaction Pattern C
 * Source of truth: .claude/skills/motion-library/SKILL.md
 *
 * The cell container (and its 1px hairlines) never moves. Only the inner
 * numeric payload is pulled toward the cursor, clamped to ±4px X / ±2.5px Y:
 *
 *   Tx = clamp((clientX − centerX) / (width / 2)  × 4,   −4,   4)
 *   Ty = clamp((clientY − centerY) / (height / 2) × 2.5, −2.5, 2.5)
 *
 * Motion is GSAP `quickTo` (0.18s power3.out) — no springs, no React state.
 * On leave the follow tweens pause and a 0.25s expo.out return runs; the next
 * move kills the return and resumes the follow from the payload's live x/y.
 */

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";

export const MAGNET_MAX_X = 4;
export const MAGNET_MAX_Y = 2.5;
export const MAGNET_FOLLOW = { duration: 0.18, ease: "power3.out" } as const;
export const MAGNET_RETURN = { duration: 0.25, ease: "expo.out" } as const;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Pure mapping from pointer position to clamped payload translation. */
export function magneticOffset(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
) {
  const dx = clientX - (rect.left + rect.width / 2);
  const dy = clientY - (rect.top + rect.height / 2);
  return {
    x: clamp((dx / (rect.width / 2)) * MAGNET_MAX_X, -MAGNET_MAX_X, MAGNET_MAX_X),
    y: clamp((dy / (rect.height / 2)) * MAGNET_MAX_Y, -MAGNET_MAX_Y, MAGNET_MAX_Y),
  };
}

type QuickTo = ReturnType<typeof gsap.quickTo>;

export interface MagneticHandlers<C extends HTMLElement> {
  onPointerMove: (e: ReactPointerEvent<C>) => void;
  onPointerLeave: (e: ReactPointerEvent<C>) => void;
}

/**
 * Wire magnetic pull into any container/payload pair.
 * `containerRef` is measured (never transformed); `payloadRef` is translated.
 */
export function useMagneticPull<C extends HTMLElement, P extends HTMLElement>(
  containerRef: RefObject<C | null>,
  payloadRef: RefObject<P | null>,
): MagneticHandlers<C> {
  const xTo = useRef<QuickTo | null>(null);
  const yTo = useRef<QuickTo | null>(null);
  const returnTween = useRef<gsap.core.Tween | null>(null);
  const enabled = useRef(true);

  // quickTo tweens are created inside the gsap.context and reverted on unmount.
  useGSAP(
    () => {
      const payload = payloadRef.current;
      if (!payload) return;
      xTo.current = gsap.quickTo(payload, "x", MAGNET_FOLLOW);
      yTo.current = gsap.quickTo(payload, "y", MAGNET_FOLLOW);
      enabled.current = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    },
    { scope: containerRef },
  );

  const onPointerMove = (e: ReactPointerEvent<C>) => {
    const payload = payloadRef.current;
    if (!enabled.current || e.pointerType === "touch" || !payload || !xTo.current || !yTo.current) {
      return;
    }
    // One rect read per move on a single element: always correct even if the
    // page scrolled under a stationary pointer. The container never transforms,
    // so this read never forces layout of animated content.
    const { x, y } = magneticOffset(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());

    if (returnTween.current) {
      returnTween.current.kill();
      returnTween.current = null;
      xTo.current(x, Number(gsap.getProperty(payload, "x")));
      yTo.current(y, Number(gsap.getProperty(payload, "y")));
      return;
    }
    xTo.current(x);
    yTo.current(y);
  };

  const onPointerLeave = () => {
    const payload = payloadRef.current;
    if (!payload) return;
    xTo.current?.tween.pause();
    yTo.current?.tween.pause();
    returnTween.current?.kill();
    returnTween.current = gsap.to(payload, { x: 0, y: 0, ...MAGNET_RETURN, overwrite: false });
  };

  // The return tween is created outside the context (in an event), so kill it explicitly.
  useEffect(() => () => void returnTween.current?.kill(), []);

  return { onPointerMove, onPointerLeave };
}

/**
 * Drop-in component form: a stationary, overflow-clipped button whose inner
 * payload is magnetic. For controls that need their own refs (e.g. an extra
 * animated layer), call `useMagneticPull` directly with your own container/payload refs.
 */
export function MagneticTelemetryCell({
  children,
  className = "",
  payloadClassName = "",
  ...rest
}: ComponentPropsWithoutRef<"button"> & { payloadClassName?: string; children: ReactNode }) {
  const cellRef = useRef<HTMLButtonElement>(null);
  const payloadRef = useRef<HTMLSpanElement>(null);
  const magnet = useMagneticPull(cellRef, payloadRef);

  return (
    <button ref={cellRef} type="button" {...rest} {...magnet} className={`relative overflow-hidden ${className}`}>
      <span ref={payloadRef} className={`relative inline-flex will-change-transform ${payloadClassName}`}>
        {children}
      </span>
    </button>
  );
}

export default MagneticTelemetryCell;
```

---

## Pattern C.1 — Tick Flash (`InteractiveOddsButton`)

Every primary bet trigger (SPREAD · MONEYLINE · TOTAL × AWAY/HOME × 6 consoles = 36
buttons) is a `React.memo` leaf with its own simulated WebSocket stream. **A tick
re-renders that one button and nothing else.**

### 3× scale rule

```ts
const PRIMARY = "font-mono text-3xl font-bold tracking-tight tabular-nums xl:text-4xl";
// micro-label: "font-mono text-[10px] uppercase tracking-[0.2em] text-[#8A99AD]"
```

Measured at 1440px: odds 36px vs 10px labels (3.6×), team code 48px, score 60px, recessed
telemetry 14px.

### Stream (boot-gated)

```
useAppStore((s) => s.isBooted)  → effect returns early until true; deps [selection.price, isBooted]
schedule():  setTimeout(cycle, 800 + rand·1700 ms)
cycle():     if (!document.hidden && rand < 0.15) fire(); schedule()
visibility:  hidden → clearTimeout; visible → schedule()
```

Verified: 0 console mutations during the 2.5s boot, then about 3 ticks/s board-wide.

### American odds stepping (`lib/market-sim.ts`)

```ts
export function stepAmerican(odds: number, dir: 1 | -1, step = 5): number {
  const next = odds + dir * step;
  if (next <= -100 || next >= 100) return next;
  return dir > 0 ? 100 + step : -(100 + step);   // −100 →(+)→ +105, +100 →(−)→ −105
}
```

The dead zone (−99 … +99) is never emitted, and every step changes implied probability
(2M-step fuzz: 0 invalid, 0 flat, 0 wrong-direction). `drawDirection` mean-reverts toward
the anchor price.

### Flash timeline

```ts
gsap.timeline()
  .set(flashLayer, { backgroundColor: probUp ? "#CCFF00" : "#FF00FF", opacity: 1 })
  .set(payload,    { color: probUp ? "#05080F" : "#FAFAFA" })   // ink per fill for contrast
  .to(flashLayer,  { opacity: 0, duration: 0.45, ease: "power2.out" }, 0.15)   // 150ms hold
  .to(payload,     { color: restInk, duration: 0.45, ease: "power2.out" }, 0.15)
  .set(payload,    { clearProps: "color" });
```

The flash layer fades over the button's own surface (`#0A101D` deck, or `#CCFF00` when
staged), which is exactly a decay back to rest. Peak ink depends on direction: dark
`#05080F` on lime, white `#FAFAFA` on fuchsia. Verified: 33/33 flashes correct on both
colour and ink, hold 132–151ms. A staged button is `border-[#CCFF00] bg-[#CCFF00]
text-[#05080F]`, and its tick badge switches to dark ink so it stays legible on lime. Verified: 28/28 colours correct,
hold 127–150ms (frame-quantised). Pressing a button stages
`{ ...selection, price: priceRef.current }`: the price locks at the live tick.

### Reference implementation — `components/command-center/InteractiveOddsButton.tsx`

```tsx
"use client";

/**
 * InteractiveOddsButton — primary 3× scale bet trigger (memoized leaf).
 *
 * Owns its own simulated WebSocket stream, gated on `isBooted`. A tick
 * re-renders THIS button only: price in local state, the 150ms delta flash on
 * a GSAP-owned layer, the magnetic pull mutating the payload transform
 * directly. Nothing propagates to the console, track or page.
 */

import gsap from "gsap";
import { memo, useEffect, useRef, useState } from "react";
import { useMagneticPull } from "@/components/motion/MagneticTelemetryCell";
import { DecodeText } from "@/components/motion/ZeroLatencyGlyphDecode";
import {
  FLASH_DECAY,
  FLASH_HOLD,
  TICK_PROBABILITY,
  drawDirection,
  impliedProbability,
  nextTickDelay,
  stepAmerican,
} from "@/lib/market-sim";
import { expectedValue, formatAmerican, type Selection } from "@/lib/mock-panoramic-data";
import { useAppStore } from "@/store/useAppStore";

/* High-Stakes Broadcast tokens. */
const INK_REST = "#FAFAFA"; // Titanium White
const INK_SELECTED = "#05080F"; // Deep Midnight on Electric Lime
const PROB_UP = "#CCFF00"; // Electric Lime — implied probability up
const PROB_DOWN = "#FF00FF"; // Fuchsia — implied probability down
/** Peak-flash ink: dark on lime, white on fuchsia (contrast on each fill). */
const INK_FLASH_UP = "#05080F";
const INK_FLASH_DOWN = "#FAFAFA";

/** The 3× scale rule: primary numerals vs 10px metadata. */
/** Below lg the row is full-width thirds, so numerals step down one size. */
const PRIMARY = "font-mono text-2xl leading-none font-bold tracking-tight tabular-nums lg:text-3xl lg:leading-tight xl:text-4xl";

interface TickState {
  price: number;
  /** +1: implied probability rose on last tick; −1: fell; 0: no tick yet. */
  dir: 1 | -1 | 0;
  /** Implied-probability change on last tick, percentage points. */
  dProb: number;
}

export interface InteractiveOddsButtonProps {
  selection: Selection;
  /** Micro-label: SPREAD / MONEYLINE / TOTAL · OVER. */
  label: string;
  /** Static line: spread ("-4.5") or total ("224.5"). Omit for moneyline. */
  line?: string;
  selected: boolean;
  /** Receives the selection re-priced at the live tick price (price locks on staging). */
  onToggle: (selection: Selection) => void;
  /** Column index → glyph-decode stagger on market switch. */
  column?: number;
}

function InteractiveOddsButtonImpl({ selection, label, line, selected, onToggle, column = 0 }: InteractiveOddsButtonProps) {
  const isBooted = useAppStore((s) => s.isBooted);
  const [tick, setTick] = useState<TickState>({ price: selection.price, dir: 0, dProb: 0 });

  const cellRef = useRef<HTMLButtonElement>(null);
  const payloadRef = useRef<HTMLSpanElement>(null);
  const flashRef = useRef<HTMLSpanElement>(null);
  const priceRef = useRef(selection.price);
  const selectedRef = useRef(selected);
  const flashTl = useRef<gsap.core.Timeline | null>(null);

  const magnet = useMagneticPull(cellRef, payloadRef);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  // ── Simulated WebSocket stream: dormant until boot, jittered, paused when hidden ──
  useEffect(() => {
    if (!isBooted) return;
    const anchor = selection.price;
    let timer: number | undefined;

    // Flash: instant peak → 150ms hold → 450ms power2.out decay. The layer fades
    // over the button's own surface (deck #0A101D, or #CCFF00 when staged).
    const flash = (probUp: boolean) => {
      const layer = flashRef.current;
      const payload = payloadRef.current;
      if (!layer || !payload) return;
      flashTl.current?.kill();
      const restInk = selectedRef.current ? INK_SELECTED : INK_REST;
      flashTl.current = gsap
        .timeline()
        .set(layer, { backgroundColor: probUp ? PROB_UP : PROB_DOWN, opacity: 1 })
        .set(payload, { color: probUp ? INK_FLASH_UP : INK_FLASH_DOWN })
        .to(layer, { opacity: 0, duration: FLASH_DECAY, ease: "power2.out" }, FLASH_HOLD)
        .to(payload, { color: restInk, duration: FLASH_DECAY, ease: "power2.out" }, FLASH_HOLD)
        .set(payload, { clearProps: "color" });
    };

    const fire = () => {
      const prev = priceRef.current;
      const next = stepAmerican(prev, drawDirection(prev, anchor));
      const pPrev = impliedProbability(prev);
      const pNext = impliedProbability(next);
      priceRef.current = next;
      setTick({ price: next, dir: pNext > pPrev ? 1 : -1, dProb: (pNext - pPrev) * 100 });
      flash(pNext > pPrev);
    };

    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(cycle, nextTickDelay());
    };
    const cycle = () => {
      if (!document.hidden && Math.random() < TICK_PROBABILITY) fire();
      schedule();
    };
    const onVisibility = () => {
      if (document.hidden) window.clearTimeout(timer);
      else schedule();
    };

    if (!document.hidden) schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      flashTl.current?.kill();
    };
  }, [selection.price, isBooted]);

  const ev = expectedValue(selection.modelProb, tick.price);
  const price = formatAmerican(tick.price);

  return (
    <button
      ref={cellRef}
      type="button"
      aria-pressed={selected}
      aria-label={`${selection.label} ${price}`}
      onClick={() => onToggle({ ...selection, price: priceRef.current })}
      {...magnet}
      className={`relative flex h-full w-full flex-col justify-between gap-1.5 overflow-hidden rounded-none border px-3 py-2 text-left lg:gap-0 lg:py-3.5 transition-colors duration-100 xl:px-4 ${
        selected
          ? "border-[#CCFF00] bg-[#CCFF00] text-[#05080F]"
          : "border-transparent bg-[#0A101D] text-[#FAFAFA] hover:bg-[#162032]"
      }`}
    >
      {/* Flash layer — GSAP-owned, never touched by React after mount. */}
      <span ref={flashRef} aria-hidden className="pointer-events-none absolute inset-0 opacity-0" />

      <span
        className={`relative truncate font-mono text-[10px] uppercase tracking-[0.2em] ${selected ? "text-[#05080F]/70" : "text-[#8A99AD]"}`}
      >
        {label}
      </span>

      {/* Magnetic payload — inherits ink so the flash recolours it in one write. */}
      <span ref={payloadRef} className="relative flex flex-col items-start gap-1 whitespace-nowrap will-change-transform">
        {line ? (
          <>
            <DecodeText text={line} index={column} className={PRIMARY} />
            <DecodeText text={price} index={column} className={`${PRIMARY} opacity-60`} />
          </>
        ) : (
          <DecodeText text={price} index={column} className={PRIMARY} />
        )}
      </span>

      {/* Last tick: 4px triangle + Δ implied probability (percentage points). */}
      <span className="relative flex h-3 items-center justify-between gap-2 font-mono text-[10px] whitespace-nowrap tabular-nums">
        {tick.dir !== 0 ? (
          <span
            className={`flex items-center gap-1 ${
              selected ? "text-[#05080F]" : tick.dir > 0 ? "text-[#CCFF00]" : "text-[#FF00FF]"
            }`}
          >
            <svg width="4" height="4" viewBox="0 0 4 4" className="block" fill="currentColor" aria-hidden>
              {tick.dir > 0 ? <polygon points="0,4 2,0 4,4" /> : <polygon points="0,0 4,0 2,4" />}
            </svg>
            {`${tick.dProb > 0 ? "+" : ""}${tick.dProb.toFixed(2)}`}
          </span>
        ) : (
          <span />
        )}
        {ev > 0 && (
          <span className={selected ? "font-bold text-[#05080F]" : "text-[#CCFF00]"}>{`+${(ev * 100).toFixed(1)}% EV`}</span>
        )}
      </span>
    </button>
  );
}

export const InteractiveOddsButton = memo(InteractiveOddsButtonImpl);
InteractiveOddsButton.displayName = "InteractiveOddsButton";

export default InteractiveOddsButton;
```

---

## Pattern C.2 — `MagneticWrapper` (spring pull for calls-to-action)

A reusable wrapper that pulls its content toward the cursor and springs it back
to exact centre. It's used on the two primary CTAs. Odds cells keep Pattern C
(`gsap.quickTo`).

### Physics

```
dx, dy = (cursor − hit-area centre) × strength (0.35)
if |(dx, dy)| > maxPull: scale to maxPull        ← radial clamp, default 15px
x, y → useSpring({ stiffness: 150, damping: 15, mass: 0.1 })
mouseleave → x, y = 0                            ← spring back to centre
```

**Why a spring is allowed here:** the library bans springs because they overshoot.
This config is **overdamped**: ζ = c / (2√(k·m)) = 15 / (2√(150 × 0.1)) ≈ **1.94 > 1**,
so it settles without overshoot. Verified: return samples decrease monotonically
(glossary 7.49px → 0.014px over 17 frames; ENGAGE label 9.1px → 0.015px).

Zero React state on mouse move: only motion values change. Touch
(`pointer: coarse`) and `prefers-reduced-motion` disable the pull. A `disabled`
button parent resets the pull to 0.

### `hitArea` — the two placement rules

| Mode | Hit area / measured box | What moves | Use for |
|---|---|---|---|
| `"self"` | the wrapper itself | the whole wrapper | **floating** CTAs (`[ ? ] QUANT GLOSSARY`) |
| `"parent"` | the wrapper's parent element | only the wrapper (the label) | **structural** CTAs locked to the 1px grid (`ENGAGE ORDER`) |

- **`self` feedback correction:** the measured rect includes the live translation, so
  the current spring offset is subtracted to recover the true resting centre.
- **Floating + `position: fixed`:** a transformed ancestor becomes the containing
  block for `fixed` descendants, so the **wrapper carries the fixed positioning**
  (`<MagneticWrapper className="fixed bottom-[…] left-6 z-50">`) and the button
  inside is static. Never wrap a `fixed` element in a translated div.
- **Structural:** the lime ENGAGE button keeps its grid cell, background and borders,
  and gets `overflow-hidden`. Only the label stack is wrapped
  (`hitArea="parent" maxPull={12}`), so the whole box is the hit area. Verified: the
  button rect is identical at every hover point and the dock's 12 columns don't move.

### Reference implementation — `components/motion/MagneticWrapper.tsx`

```tsx
"use client";

/**
 * MagneticWrapper — Pattern C.2 (spring-driven magnetic pull for CTAs).
 * Source of truth: .claude/skills/motion-library/SKILL.md
 *
 * Pulls its content toward the cursor by a fraction of the cursor→centre
 * distance, radially clamped to `maxPull`, and springs back to exact centre on
 * leave. Spring { stiffness 150, damping 15, mass 0.1 } is OVERDAMPED
 * (ζ = 15 / (2·√(150·0.1)) ≈ 1.94 > 1), so it settles without overshoot —
 * consistent with the library's no-bounce rule.
 *
 * hitArea:
 *   "self"   — the wrapper is the hit area and is what moves (floating CTAs).
 *              Its rect includes the live translation, so the current spring
 *              offset is subtracted to recover the true resting centre.
 *   "parent" — listen on and measure the PARENT (e.g. a rigid grid button) but
 *              translate only this wrapper: the box stays still, the label floats.
 *
 * Zero React state on mouse move: only motion values change.
 */

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

export const MAGNETIC_SPRING = { stiffness: 150, damping: 15, mass: 0.1 } as const;
export const MAGNETIC_MAX_PULL = 15;
export const MAGNETIC_STRENGTH = 0.35;

export interface MagneticWrapperProps {
  children: ReactNode;
  /** Max pull radius in px (radial clamp). */
  maxPull?: number;
  /** Fraction of the cursor→centre distance applied before clamping. */
  strength?: number;
  hitArea?: "self" | "parent";
  className?: string;
}

export function MagneticWrapper({
  children,
  maxPull = MAGNETIC_MAX_PULL,
  strength = MAGNETIC_STRENGTH,
  hitArea = "self",
  className,
}: MagneticWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, MAGNETIC_SPRING);
  const sy = useSpring(y, MAGNETIC_SPRING);

  useEffect(() => {
    const el = ref.current;
    const target = hitArea === "parent" ? el?.parentElement : el;
    if (!el || !target) return;

    const coarse = window.matchMedia("(pointer: coarse)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const reset = () => {
      x.set(0);
      y.set(0);
    };

    const onMove = (e: MouseEvent) => {
      if (coarse.matches || reduced.matches) return;
      if (target instanceof HTMLButtonElement && target.disabled) return reset();
      const r = target.getBoundingClientRect();
      // "self": the measured box is the moving one — remove the live offset.
      const ox = hitArea === "self" ? sx.get() : 0;
      const oy = hitArea === "self" ? sy.get() : 0;
      let dx = (e.clientX - (r.left - ox + r.width / 2)) * strength;
      let dy = (e.clientY - (r.top - oy + r.height / 2)) * strength;
      const mag = Math.hypot(dx, dy);
      if (mag > maxPull) {
        const k = maxPull / mag;
        dx *= k;
        dy *= k;
      }
      x.set(dx);
      y.set(dy);
    };

    target.addEventListener("mousemove", onMove);
    target.addEventListener("mouseleave", reset);
    return () => {
      target.removeEventListener("mousemove", onMove);
      target.removeEventListener("mouseleave", reset);
    };
  }, [hitArea, maxPull, strength, x, y, sx, sy]);

  return (
    <motion.div ref={ref} data-magnetic={hitArea} className={className} style={{ x: sx, y: sy }}>
      {children}
    </motion.div>
  );
}

export default MagneticWrapper;
```

---

## Pattern D — `ZeroLatencyGlyphDecode`

### Concept

A market switch (`NBA` → `NFL` → `SOCCER`) replaces every console's data in **one
synchronous commit**: a `0ms` frame cut with no fade, no exit animation and no intermediate state.
In that same commit, team codes, scores, odds and the telemetry cells start a
**mechanical character decode**. Each character cycles through quant glyphs once per animation
frame and locks onto its final value, left to right, the way a terminal re-draws
a buffer.

### Timing

| Parameter | Value |
|---|---|
| Glyph set | `['0', '1', 'X', '#', '/', '8', '+']` |
| Frames per character before lock | 4–6 (seeded per character) |
| Character spread inside a string | 40ms, left → right |
| Burst per element | `6 × 16.67ms + 40ms = 140ms` |
| Column stagger | `8ms × columnIndex` |
| Structural characters (never scrambled) | space `. : , % $ @ — → '` |

Lock time for character *j* of an *n*-character string:

$$t_j = \text{frames}_j \cdot 16.\overline{6}\,\text{ms} + \frac{j}{n-1} \cdot 40\,\text{ms}, \qquad \text{frames}_j \in \{4,5,6\}$$

Timing is wall-clock, so the burst has the same duration on 60Hz and 120Hz displays
(120Hz just shows more glyph swaps). A seeded PRNG (mulberry32, seeded from trigger,
column and length) makes each switch's burst reproducible.

### DOM ownership (the critical rule)

React renders the final string as **one text node**. The decode mutates **that same
node's `nodeValue`**. It never replaces the node and never touches `textContent` or
`innerHTML`. React keeps its reference to the node, so later reconciliation (an odds
tick changing the price mid-burst, for example) stays valid. Each frame reads the latest
React text from a ref, so the burst always locks onto current data, and the effect
cleanup writes that text back.

### Trigger semantics

Triggers are **monotonically increasing counters**. A burst runs only when the trigger
**increases**, or on mount when it is `> 0`.

- Default trigger: the store's `marketSwitchTick` (re-selecting the active market is a
  no-op in the store, so it never fires spuriously).
- `triggerKey <= 0`: idle (first paint; the boot sequence owns that reveal).
- Mount with `triggerKey > 0`: decode (odds buttons remounted by their market-scoped key).
- The first scrambled frame is written in `useLayoutEffect`, so swapped data never paints
  unscrambled for a frame.
- `prefers-reduced-motion`: plain `0ms` cut.
- In the marquee's invisible max-weight ghost layer (Pattern A), render plain text.

Verified (NBA → NFL): console 01's team code goes `0# → #X → K8 → KC`, and its EV cell
goes `0#.#% 8# → +3.5% EV`, locked by ~200ms.

### Usage

```tsx
<DecodeText as="div" text={team.code} index={0} className="font-sans text-4xl font-bold xl:text-5xl" />
<DecodeText as="dd" text={`${ev > 0 ? "+" : ""}${(ev * 100).toFixed(1)}% EV`} index={0} className="font-mono text-sm" />
// or the hook directly, with any trigger:
const ref = useTelemetryScramble<HTMLSpanElement>(label, someCounter, 3);
return <span ref={ref}>{label}</span>;
```

Pass exactly one string child. Combine fragments into a single template string
(`` `${sign}${value}%` ``) so React emits a single text node.

### Reference implementation — `components/motion/ZeroLatencyGlyphDecode.tsx`

```tsx
"use client";

/**
 * ZeroLatencyGlyphDecode — Interaction Pattern D
 * Source of truth: .claude/skills/motion-library/SKILL.md
 *
 * Content swaps are 0ms cuts. Immediately after a swap, text nodes run a
 * mechanical decode burst: every character cycles through quant glyphs on
 * each animation frame and locks onto its final value after 4–6 frames,
 * left-to-right, with an 8ms stagger per column index. The burst is
 * time-based (identical on 60Hz and 120Hz displays) and never touches
 * opacity.
 *
 * DOM ownership: React renders the final string as a single text node. The
 * decode mutates that SAME node's `nodeValue` (never replaces it), so React's
 * reconciliation stays valid; the burst always ends by writing the latest
 * React text back.
 */

import { useEffect, useLayoutEffect, useRef, type ElementType, type RefObject } from "react";
import { useAppStore } from "@/store/useAppStore";

export const DECODE_GLYPHS = ["0", "1", "X", "#", "/", "8", "+"] as const;
/** Frame budget per character (at 60Hz): 4–6 frames before lock. */
export const DECODE_FRAME_MS = 1000 / 60;
export const DECODE_MIN_FRAMES = 4;
export const DECODE_MAX_FRAMES = 6;
/** Left→right lock spread inside one string. */
export const DECODE_CHAR_SPREAD_MS = 40;
/** Per-column-index start offset. */
export const DECODE_COLUMN_STAGGER_MS = 8;
/** One element's burst: 6 frames (100ms) + 40ms char spread = 140ms. */
export const DECODE_DURATION_MS = DECODE_MAX_FRAMES * DECODE_FRAME_MS + DECODE_CHAR_SPREAD_MS;

/** Structural characters keep their position so the data shape reads through the noise. */
const STRUCTURAL = new Set([" ", ".", ":", ",", "%", "$", "@", "—", "→", "'"]);

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Tiny deterministic PRNG (mulberry32) so a given switch always renders the same burst. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Lock time (ms after the element's start) for each character of `text`. */
export function decodeSchedule(text: string, seed: number): number[] {
  const rand = prng(seed);
  const n = text.length;
  return Array.from(text, (_, j) => {
    const frames = DECODE_MIN_FRAMES + Math.floor(rand() * (DECODE_MAX_FRAMES - DECODE_MIN_FRAMES + 1));
    const spread = n > 1 ? (j / (n - 1)) * DECODE_CHAR_SPREAD_MS : 0;
    return frames * DECODE_FRAME_MS + spread;
  });
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Triggers are monotonically increasing counters (switch ticks, focus epochs).
 * A decode burst runs when `triggerKey` INCREASES to a positive value, or on
 * mount when `triggerKey > 0` (a node created by a market switch).
 * `triggerKey <= 0` is idle (first paint after boot). Because only increases
 * fire, a composite trigger (e.g. `isFocused ? focusCounter : switchTick`)
 * decodes when an element gains focus but stays silent when it loses focus.
 */
export function useTelemetryScramble<T extends HTMLElement>(
  text: string,
  triggerKey: number,
  columnIndex = 0,
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const latestText = useRef(text);
  const lastTrigger = useRef<number | null>(null);
  const raf = useRef(0);

  useIsoLayoutEffect(() => {
    latestText.current = text;
  }, [text]);

  useIsoLayoutEffect(() => {
    const prev = lastTrigger.current;
    lastTrigger.current = triggerKey;
    if (triggerKey <= 0 || (prev !== null && triggerKey <= prev)) return;

    const node = ref.current?.firstChild;
    if (!node || node.nodeType !== Node.TEXT_NODE || prefersReducedMotion()) return;

    const target = latestText.current;
    const seed = triggerKey * 7919 + columnIndex * 104729 + target.length;
    const rand = prng(seed ^ 0x9e3779b9);
    const locks = decodeSchedule(target, seed);
    const startOffset = columnIndex * DECODE_COLUMN_STAGGER_MS;
    const t0 = performance.now();

    const frame = (now: number) => {
      const elapsed = now - t0 - startOffset;
      // Live text may have changed mid-burst (e.g. an odds tick): always lock to latest.
      const final = latestText.current;
      let out = "";
      let done = true;
      for (let j = 0; j < final.length; j++) {
        const ch = final[j];
        if (STRUCTURAL.has(ch) || elapsed >= (locks[j] ?? DECODE_DURATION_MS)) {
          out += ch;
        } else {
          out += DECODE_GLYPHS[Math.floor(rand() * DECODE_GLYPHS.length)];
          done = false;
        }
      }
      node.nodeValue = out;
      if (!done) raf.current = requestAnimationFrame(frame);
    };

    // First scrambled frame is written synchronously in the layout phase, so
    // the swapped data never paints un-scrambled for a frame.
    frame(t0);

    return () => {
      cancelAnimationFrame(raf.current);
      node.nodeValue = latestText.current;
    };
  }, [triggerKey, columnIndex]);

  return ref;
}

export interface DecodeTextProps {
  text: string | number;
  /** Column index → 8ms × index start stagger. */
  index?: number;
  /** Override the trigger (defaults to the store's `marketSwitchTick`). ≤ 0 = idle. */
  trigger?: number;
  as?: ElementType;
  className?: string;
  title?: string;
}

/** Drop-in text node that decodes on every market switch (or a custom trigger). */
export function DecodeText({ text, index = 0, trigger, as: Tag = "span", className, title }: DecodeTextProps) {
  const storeTick = useAppStore((s) => s.marketSwitchTick);
  const value = String(text);
  const ref = useTelemetryScramble<HTMLElement>(value, trigger ?? storeTick, index);
  return (
    <Tag ref={ref} className={className} title={title}>
      {value}
    </Tag>
  );
}

export default DecodeText;
```

---

## Pattern E — `QuantCursor`

A context-aware cursor mounted once in `app/layout.tsx`. Fine pointers only: CSS hides
the system cursor under `@media (pointer: fine)`, and the component renders as
`hidden pointer-fine:block` and attaches no listeners on coarse/touch devices.

| State | Where | Shape |
|---|---|---|
| A — Editorial | everywhere else | 4×4px square dot (`h-1 w-1 rounded-none bg-[#FAFAFA]`) |
| B — Telemetry | over the panoramic track: `[data-cursor-zone="telemetry-grid"]` | 24×24px crosshair of 1px hairlines, 2px centre void |

### Mechanics

- Root: `pointer-events-none fixed top-0 left-0 z-[9999] mix-blend-difference`. It is
  positioned with `gsap.quickTo(root, "x"|"y", { duration: 0.04, ease: "none" })` from a
  single `window` `pointermove` listener (passive).
- Zone detection: `e.target.closest('[data-cursor-zone="telemetry-grid"]')`. The
  boolean is kept in a closure variable, and a morph tween runs **only when it flips**.
- Morph (`0.16s power4.out`): dot → `scale 0, autoAlpha 0`; horizontal arm `scaleX
  0.16 → 1`; vertical arm `scaleY 0.16 → 1`. Reverse on exit.
- Press: reticle `scale 0.75` (`0.08s`) on `pointerdown`, back to `1` on `pointerup` /
  `pointercancel`.
- First `pointermove` *sets* the position before revealing, so the cursor never slides
  in from (0,0). It hides when the pointer leaves the document.
- **Hairline crispness**: center each 1px arm only along its **long** axis (`-translate-x-1/2`
  on the horizontal arm, `-translate-y-1/2` on the vertical). A −0.5px offset on the
  short axis would anti-alias the hairline into a 2px grey smear.
- Tailwind v4 `translate-*` utilities use the CSS `translate` property, which is separate
  from `transform`, so GSAP's `scale`/`x`/`y` combine with them without overwriting.
- The centre void is two 11px segments per arm with a 2px gap (`justify-between`), not a
  gradient mask.

### Reference implementation — `components/motion/QuantCursor.tsx`

```tsx
"use client";

/**
 * QuantCursor — context-aware brutalist cursor (Pattern E).
 * Source of truth: .claude/skills/motion-library/SKILL.md
 *
 * State A (editorial):  4×4px square dot.
 * State B (telemetry):  24×24px 1px hairline crosshair with a 2px centre void,
 *                       active over the panoramic track: [data-cursor-zone="telemetry-grid"].
 *
 * Fine pointers only. Position is driven by gsap.quickTo (0.04s) on a single
 * fixed root; zone morphs fire only when the zone boolean flips.
 */

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

export const CURSOR_ZONE_SELECTOR = '[data-cursor-zone="telemetry-grid"]';
export const CURSOR_FOLLOW = { duration: 0.04, ease: "none" } as const;
export const CURSOR_MORPH = { duration: 0.16, ease: "power4.out" } as const;
export const CURSOR_ARM_REST = 0.16;
export const CURSOR_PRESS_SCALE = 0.75;

export function QuantCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const armXRef = useRef<HTMLSpanElement>(null);
  const armYRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const reticle = reticleRef.current;
      const dot = dotRef.current;
      const armX = armXRef.current;
      const armY = armYRef.current;
      if (!root || !reticle || !dot || !armX || !armY) return;

      const fine = window.matchMedia("(pointer: fine)");
      if (!fine.matches) return; // Touch / coarse: leave the native experience alone.

      gsap.set(root, { autoAlpha: 0 });
      gsap.set(armX, { scaleX: CURSOR_ARM_REST, autoAlpha: 0 });
      gsap.set(armY, { scaleY: CURSOR_ARM_REST, autoAlpha: 0 });

      const xTo = gsap.quickTo(root, "x", CURSOR_FOLLOW);
      const yTo = gsap.quickTo(root, "y", CURSOR_FOLLOW);

      let inZone = false;
      let visible = false;

      const morph = (toZone: boolean) => {
        gsap.to(dot, { scale: toZone ? 0 : 1, autoAlpha: toZone ? 0 : 1, ...CURSOR_MORPH, overwrite: "auto" });
        gsap.to(armX, {
          scaleX: toZone ? 1 : CURSOR_ARM_REST,
          autoAlpha: toZone ? 1 : 0,
          ...CURSOR_MORPH,
          overwrite: "auto",
        });
        gsap.to(armY, {
          scaleY: toZone ? 1 : CURSOR_ARM_REST,
          autoAlpha: toZone ? 1 : 0,
          ...CURSOR_MORPH,
          overwrite: "auto",
        });
      };

      const onMove = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        if (!visible) {
          // First sighting: jump into place, then reveal — never slide in from 0,0.
          gsap.set(root, { x: e.clientX, y: e.clientY });
          gsap.to(root, { autoAlpha: 1, duration: 0.08, overwrite: "auto" });
          visible = true;
        }
        xTo(e.clientX);
        yTo(e.clientY);

        const target = e.target instanceof Element ? e.target : null;
        const zone = Boolean(target?.closest(CURSOR_ZONE_SELECTOR));
        if (zone !== inZone) {
          inZone = zone;
          morph(zone);
        }
      };

      const onDown = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        gsap.to(reticle, { scale: CURSOR_PRESS_SCALE, duration: 0.08, ease: "power2.out", overwrite: "auto" });
      };
      const onUp = () => {
        gsap.to(reticle, { scale: 1, duration: 0.08, ease: "power2.out", overwrite: "auto" });
      };
      const onLeaveWindow = (e: PointerEvent) => {
        if (e.relatedTarget) return;
        visible = false;
        gsap.to(root, { autoAlpha: 0, duration: 0.08, overwrite: "auto" });
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
      window.addEventListener("pointerup", onUp, { passive: true });
      window.addEventListener("pointercancel", onUp, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeaveWindow);

      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        document.documentElement.removeEventListener("pointerleave", onLeaveWindow);
      };
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      aria-hidden
      data-quant-cursor
      className="pointer-events-none fixed top-0 left-0 z-[9999] hidden mix-blend-difference pointer-fine:block"
    >
      <div ref={reticleRef} className="relative">
        {/* State A — 4×4 square dot */}
        <span
          ref={dotRef}
          className="absolute top-0 left-0 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-none bg-[#FAFAFA]"
        />
        {/* State B — horizontal arm: two 11px segments around a 2px centre void.
            Only the long axis is centred: a −0.5px offset on a 1px hairline would
            anti-alias it into a 2px grey smear. */}
        <span
          ref={armXRef}
          className="absolute top-0 left-0 flex h-px w-6 -translate-x-1/2 justify-between rounded-none"
        >
          <span className="h-px w-[11px] rounded-none bg-[#FAFAFA]" />
          <span className="h-px w-[11px] rounded-none bg-[#FAFAFA]" />
        </span>
        {/* State B — vertical arm */}
        <span
          ref={armYRef}
          className="absolute top-0 left-0 flex h-6 w-px -translate-y-1/2 flex-col justify-between rounded-none"
        >
          <span className="h-[11px] w-px rounded-none bg-[#FAFAFA]" />
          <span className="h-[11px] w-px rounded-none bg-[#FAFAFA]" />
        </span>
      </div>
    </div>
  );
}

export default QuantCursor;
```

---

## Pattern F — `TerminalBootLoader`

A deterministic **2.50s** cold boot, mounted at the top of `app/page.tsx`. It renders in
the SSR HTML (the store starts with `isBooted: false`), so the cockpit is never visible
before the boot. It hands off with a `0ms` cut, and the odds streams arm on that frame.

### Master timeline

| Time (s) | Event |
|---|---|
| 0.04 / 0.18 / 0.42 / 0.68 / 0.94 / 1.18 / 1.32 | Diagnostic line *i* snaps visible (`visibility`, 0ms) with `[WAIT]` `#FF00FF` |
| next line's time (last: 1.35) | Line *i* flips `[WAIT]` → `[OK]` `#CCFF00` (`display` swap, 0ms) |
| 0.00 → 1.35 | Counter `000.0%` → `100.0%`, `steps(54)`, `tabular-nums` |
| 0.00 → 2.45 | 2px `#FF00FF` progress hairline, `scaleX 0 → 1`, `steps(24)` |
| 1.20 → 1.75 | **Tier 1** status hairline (`top: 47px`), `scaleX 0 → 1`, `0.55s power4.inOut` |
| 1.30 → 1.95 | **Tier 2** console frame, left & right edges `scaleY 0 → 1`, `0.65s` |
| 1.42 → 2.13 | **Tier 2** console frame, top & bottom edges `scaleX 0 → 1`, `0.65s`, stagger `0.06` |
| 1.85 → 2.40 | **Tier 3** dock hairline (`top: 100vh − 96px`), `scaleX 0 → 1`, `0.55s` |
| **2.50** | `gsap.set(overlay, { display: "none" })`, then `onComplete` → `setBooted(true)` |

The diagnostic panel is positioned *inside* the measured console frame, so the boot
reads as the first console powering on.

### Rules learned the hard way

| Rule | Why |
|---|---|
| T+0 is the **first frame after hydration** (paused timeline + double rAF → `play(0)`). | Starting at hydration let a ~300ms hydration long task swallow the start of Phase A: lines 0 and 1 appeared on the same frame. |
| `gsap.ticker.lagSmoothing(0)` during boot, restored to `(500, 33)` after. | With lag smoothing on, a long frame *stretches* the timeline. The boot must be wall-clock exact (measured 2.47s first log line → cut, expected 2.46s). |
| Hairline positions are **measured** from `[data-boot-anchor="statusbar" \| "dock"]` and `[data-console][data-index="0"]`, and passed in as CSS variables (with `calc()` fallbacks). | Fixed offsets drift with gutters, fonts and viewport size. Measured at 1440×900, the lines match the live borders exactly: status y=47, console frame 144/101/1152×650, dock y=804. |
| Initial collapsed geometry is an **inline `transform: scaleX(0)`**, never Tailwind `scale-x-0`. | Tailwind v4 `scale-*` writes the separate CSS `scale` property, which multiplies with GSAP's `transform`, so the line would stay at 0 forever. |
| Initial hidden states (`invisible` lines, collapsed lines) are in the SSR markup. | Otherwise everything flashes visible between first paint and hydration. |
| No runtime scroll lock is needed. | The cockpit is permanently `overflow: hidden` on `html, body`, so the boot cannot be scrolled past. |
| Odds streams are gated on `isBooted` (Pattern C.1). | Verified: 2,467ms from first log line to cut (2,460ms scheduled, within one frame); 0 console mutations during boot. |

### Reference implementation — `components/motion/TerminalBootLoader.tsx`

```tsx
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
```

### Store — `store/useAppStore.ts`

```ts
import { create } from "zustand";

export type MarketType = "NBA" | "NFL" | "SOCCER";

export const MARKET_TYPES = ["NBA", "NFL", "SOCCER"] as const satisfies readonly MarketType[];

interface AppState {
  isBooted: boolean;
  setBooted: (booted: boolean) => void;
  activeMarket: MarketType;
  setActiveMarket: (market: MarketType) => void;
  /** Console currently snapped in the centre of the panoramic track. */
  activeConsoleIndex: number;
  setActiveConsoleIndex: (index: number) => void;
  /**
   * Navigation request for the track (quick-jump pills, arrow keys). `seq`
   * increments on every request so repeated jumps to the same index still fire.
   */
  consoleJump: { index: number; seq: number };
  jumpToConsole: (index: number) => void;
  /** Increments on every market switch → triggers mechanical glyph decode. */
  marketSwitchTick: number;
}

export const useAppStore = create<AppState>((set) => ({
  isBooted: false,
  setBooted: (booted) => set({ isBooted: booted }),
  activeMarket: "NBA",
  // The console index is preserved across markets: data swaps in place (0ms),
  // the track never jumps.
  setActiveMarket: (market) =>
    set((state) =>
      state.activeMarket === market
        ? state
        : { activeMarket: market, marketSwitchTick: state.marketSwitchTick + 1 },
    ),
  activeConsoleIndex: 0,
  setActiveConsoleIndex: (index) =>
    set((state) => (state.activeConsoleIndex === index ? state : { activeConsoleIndex: index })),
  consoleJump: { index: 0, seq: 0 },
  jumpToConsole: (index) => set((state) => ({ consoleJump: { index, seq: state.consoleJump.seq + 1 } })),
  marketSwitchTick: 0,
}));
```

---

## Pattern G — Console Poster & `QuantGlossary` (broadcast chrome)

### Console poster (left 5/12 of every `MatchupConsole`, mandatory)

- **Photography**: for each console slot, all three markets' frames are mounted
  (`next/image`) and toggled with `visibility`. Remote Unsplash URLs go through the
  custom loader. **Local files** (`/images/…`, used by SOCCER) render with
  `unoptimized` and an `encodeURI`'d src, because filenames contain spaces, which would
  break a `srcset`, and the loader passes site-relative paths through untouched. Classes:
  `scale-105 object-cover opacity-40 mix-blend-luminosity contrast-125 transition-transform
  duration-700 group-hover:scale-100`. Hover is a slow `transform` only. Verified: the
  incoming market's frame is already loaded at the cut.
- **Vignette**: the single sanctioned gradient (rule 6).
- **Bleed-off display codes**: `font-display text-[9rem] xl:text-[12rem] font-black
  leading-[0.78]`. The away code is top-left (`-mt-3 -ml-4`, `text-[#FAFAFA]/15
  stroke-text`), the home code bottom-right (`-mr-6`, `text-[#CCFF00]/20`). Both decode on
  market switch.
- **`--font-display`** = `"Runiga", "Adore Sans", var(--font-broadcast-display), sans-serif`.
  `next/font/google` **Anton** binds `--font-broadcast-display` today, and a commented
  `next/font/local` block binds the same variable once `public/fonts/Runiga-Regular.woff2`
  / `AdoreSans-Bold.woff2` is dropped in. `.font-display` sets `font-synthesis-weight:
  none`: Anton ships a single weight, so `font-black` must never synthesise a smeared
  faux-bold.
- **Lockup**: a 1px `#162032` frame holding the lime clock badge, the display score
  (`88 — 84`), broadcast/venue, and the literal photo caption.

### `QuantGlossary` slide-over (`components/dashboard/QuantGlossary.tsx`)

| Element | Spec |
|---|---|
| Trigger | `fixed bottom-[calc(76px+(100dvh−144px)×0.035)] left-6 z-50 h-10` (centred in the 7%-of-track gap between console and dock; a fixed offset collides with the console on shorter viewports), lime 1px border, inverts to lime fill on hover; toggles on click or `?`, closes on `Escape` (ignored inside inputs) |
| Panel | `fixed bottom-[160px] left-6 w-[420px]`, lime border, `role="dialog"` |
| Motion | `AnimatePresence`: `initial {opacity 0, x −24}` → `animate {opacity 1, x 0}` → `exit` mirror, `0.2s` `[0.16, 1, 0.3, 1]` |
| Content | EV Edge · CLV · Handle Split: plain-English definition, a "broadcast rule", and a visual example drawn with the live UI's own vocabulary (EV chip, line move, split bar) |

This is the one place `AnimatePresence` and an `opacity` tween are allowed: it is
reference chrome, never market data.

### Reference implementation — `components/dashboard/QuantGlossary.tsx`

```tsx
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
```

---

## Review checklist for any motion change

- [ ] No `useState` / `setState` in a rAF, ticker, `onUpdate`, wheel, or pointer-move callback.
- [ ] Ticks stay inside memoized `InteractiveOddsButton` leaves; consoles/track/page never re-render on a tick.
- [ ] Market switches are 0ms cuts (+ glyph decode). Zero `opacity` fades on data.
- [ ] Nothing streams before `isBooted`.
- [ ] The document never scrolls vertically; every navigation path is horizontal and lands on a console.
- [ ] Only `transform` / `opacity` animate (plus font variation on reserved-width boxes, and flash ink).
- [ ] Structural 1px `#162032` hairlines are never transformed; 0px radius in every state.
- [ ] Primary odds `text-3xl xl:text-4xl` vs 10px labels (≥ 3×); telemetry stays recessed.
- [ ] Only broadcast tokens in source: grep for legacy hex/RGB returns nothing.
- [ ] Magnetic CTAs: structural boxes never move (wrap the label, `hitArea="parent"`); floating wrappers carry `fixed` themselves; springs must be overdamped (ζ > 1).
- [ ] Every console renders its photo poster; images swap by `visibility`, never `src`.
- [ ] Mutating numerals are `font-mono tabular-nums`.
- [ ] GSAP inside `useGSAP({ scope })`; event-created tweens killed on unmount.
- [ ] Reduced-motion and coarse-pointer paths verified.
- [ ] `npx tsc --noEmit`, `npx eslint .`, `npm run build` pass.

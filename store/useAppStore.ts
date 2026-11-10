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

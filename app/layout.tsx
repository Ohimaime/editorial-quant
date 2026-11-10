import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { QuantCursor } from "@/components/motion/QuantCursor";
import "./globals.css";

/* ── UI labels: Inter (variable wght axis for the marquee weight sweep) ─── */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/* ── Tabular odds, clocks, telemetry: JetBrains Mono (variable) ─────────── */
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

/* ── Display: Runiga (local, public/fonts/runiga/Runiga.otf) ────────────────
 * Binds --font-broadcast-display, which globals.css bridges into
 * --font-display → every `.font-display` element (console team codes, score
 * lockups) renders in Runiga. Runiga ships a single 400 weight;
 * `.font-display` disables weight synthesis, so `font-black` never fakes bold.
 *
 * LICENCE: Runiga is personal-use only per its Read Me. A commercial licence
 * (brandsemut.com/product/runiga) is required before any public/commercial use.
 */
const broadcastDisplay = localFont({
  src: [{ path: "../public/fonts/runiga/Runiga.otf", weight: "400", style: "normal" }],
  variable: "--font-broadcast-display",
  display: "swap",
  // Runiga is a display serif: size-adjust the metric fallback against a serif.
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "serif"],
});

export const metadata: Metadata = {
  title: "Panoramic Command Center",
  description: "High-stakes broadcast execution desk: NBA, NFL and soccer matchup consoles with a Kelly allocator dock.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // Browser extensions (e.g. Grammarly) inject attributes into <html>/<body>
      // before hydration; suppress the attribute-level mismatch warning on both.
      // (suppressHydrationWarning is one level deep: it does not mask child errors.)
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${broadcastDisplay.variable} antialiased`}
    >
      <body suppressHydrationWarning className="h-dvh overflow-hidden bg-[#05080F] font-sans text-[#FAFAFA]">
        {children}
        <QuantCursor />
      </body>
    </html>
  );
}

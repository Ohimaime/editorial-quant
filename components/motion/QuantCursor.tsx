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

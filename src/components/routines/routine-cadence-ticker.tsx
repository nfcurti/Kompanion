"use client";

import { useEffect, useRef } from "react";

const LIVE_PULSE_MS = 5_000;

/**
 * Keeps Live cadence routines moving while the workspace is open.
 * Slower cadences are also picked up by Vercel Cron.
 */
export function RoutineCadenceTicker() {
  const inFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function pulse() {
      if (inFlight.current || cancelled || document.hidden) return;
      inFlight.current = true;
      try {
        await fetch("/api/routines/tick?live=1", { method: "POST" });
      } catch {
        // Next pulse retries.
      } finally {
        inFlight.current = false;
      }
    }

    void pulse();
    const id = window.setInterval(() => {
      void pulse();
    }, LIVE_PULSE_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") void pulse();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}

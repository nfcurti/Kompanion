"use client";

import { useEffect, useRef } from "react";

import { useWorkspace } from "@/components/workspace/workspace-provider";
import type { StudioInboxItem } from "@/lib/studio-inbox";

const POLL_MS = 4_000;

/**
 * Posts agent, capability, and routine work into Studio as a dashboard feed.
 * Does not ask Studio to generate a follow-up.
 */
export function StudioInboxBridge() {
  const { postStudioEvent, status } = useWorkspace();
  const inFlight = useRef(false);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;

    async function drain() {
      if (inFlight.current || cancelled || document.hidden) return;
      if (status !== "ready") return;
      inFlight.current = true;
      try {
        const response = await fetch("/api/studio/inbox");
        if (!response.ok) return;
        const payload = (await response.json()) as { items?: StudioInboxItem[] };
        const pending = (payload.items ?? []).filter(
          (item) => item.output.trim() && !seen.current.has(item.id),
        );
        const item = pending[0];
        if (!item) return;

        seen.current.add(item.id);
        postStudioEvent({
          text: item.output,
          metadata: {
            origin: item.kind,
            title: item.title,
            agentName: item.agentName,
          },
        });
        const ack = await fetch("/api/studio/inbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [item.id] }),
        });
        if (!ack.ok) seen.current.delete(item.id);
      } catch {
        // Next poll retries.
      } finally {
        inFlight.current = false;
      }
    }

    void drain();
    const id = window.setInterval(() => {
      void drain();
    }, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") void drain();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [postStudioEvent, status]);

  return null;
}

"use client";

import { useEffect, useState } from "react";

import { formatLocalClock, formatLocalDateTime } from "@/lib/format-local-time";

export function LocalTime({
  value,
  fallback = "Unknown",
  withSeconds = false,
  variant = "datetime",
}: {
  value: string | null | undefined;
  fallback?: string;
  withSeconds?: boolean;
  variant?: "datetime" | "clock";
}) {
  const [label, setLabel] = useState<string | null>(() => {
    if (!value) return null;
    return variant === "clock"
      ? formatLocalClock(value)
      : formatLocalDateTime(value, { withSeconds });
  });

  useEffect(() => {
    if (!value) {
      setLabel(null);
      return;
    }
    setLabel(
      variant === "clock"
        ? formatLocalClock(value)
        : formatLocalDateTime(value, { withSeconds }),
    );
  }, [value, variant, withSeconds]);

  if (!value) return <>{fallback}</>;

  return (
    <time dateTime={value} suppressHydrationWarning>
      {label ?? "\u00a0"}
    </time>
  );
}

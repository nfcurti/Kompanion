"use client";

import { useEffect, useState } from "react";

import { formatLocalDateTime } from "@/lib/format-local-time";

export function LocalTime({
  value,
  fallback = "Unknown",
  withSeconds = false,
}: {
  value: string | null | undefined;
  fallback?: string;
  withSeconds?: boolean;
}) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setLabel(null);
      return;
    }
    setLabel(formatLocalDateTime(value, { withSeconds }));
  }, [value, withSeconds]);

  if (!value) return <>{fallback}</>;

  return (
    <time dateTime={value} suppressHydrationWarning>
      {label ?? "\u00a0"}
    </time>
  );
}

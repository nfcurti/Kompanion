export function formatLocalDateTime(
  iso: string,
  options?: { withSeconds?: boolean },
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...(options?.withSeconds ? { second: "2-digit" as const } : {}),
    timeZone,
  }).format(date);
}

/** Local clock as HH:mm:ss, e.g. 19:00:32. */
export function formatLocalClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

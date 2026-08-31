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

import { createHash } from "node:crypto";

export type LeadItem = Record<string, unknown>;

export type ParsedLeadOutput = {
  status?: string;
  items: LeadItem[];
  observed: unknown;
  rawObject: Record<string, unknown>;
};

const ID_KEYS = ["id", "Id", "ID"];
const HREF_KEYS = ["href", "url", "link", "Url", "URL"];
const TITLE_KEYS = ["title", "Titolo", "name", "Name"];
const SITE_KEYS = ["site", "source", "platform"];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickString(item: LeadItem, keys: string[]): string | null {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  for (const [key, value] of Object.entries(item)) {
    if (
      keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()) &&
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }
  return null;
}

function listingNumber(text: string | null): string | null {
  if (!text) return null;
  const match = text.match(/#(\d{3,})/);
  return match?.[1] ?? null;
}

function normalizeHref(href: string): string {
  try {
    const url = new URL(href);
    url.hash = "";
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return `${url.host.toLowerCase()}${path}${url.search}`;
  } catch {
    return href.trim().toLowerCase();
  }
}

/** Stable key for a listing so repeats are not sent to Studio again. */
export function leadItemKey(item: LeadItem): string {
  const id = pickString(item, ID_KEYS);
  const title = pickString(item, TITLE_KEYS);
  const number = listingNumber(id) ?? listingNumber(title);
  if (number) return `listing:#${number}`;
  if (id) return `id:${id.toLowerCase()}`;

  const href = pickString(item, HREF_KEYS);
  if (href) return `href:${normalizeHref(href)}`;

  const site = pickString(item, SITE_KEYS)?.toLowerCase() ?? "";
  const desc = pickString(item, ["description", "Descrizione", "summary"]);
  const basis = `${site}|${title ?? ""}|${desc ?? ""}`;
  if (basis.replace(/\|/g, "").trim()) {
    return `fp:${createHash("sha1").update(basis).digest("hex").slice(0, 20)}`;
  }

  return `fp:${createHash("sha1").update(JSON.stringify(item)).digest("hex").slice(0, 20)}`;
}

export function parseLeadOutput(raw: string): ParsedLeadOutput | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      const items = parsed.filter(
        (row): row is LeadItem => Boolean(asRecord(row)),
      );
      return { items, observed: null, rawObject: { items } };
    }
    const rec = asRecord(parsed);
    if (!rec) return null;
    const rows = rec.items;
    const items = Array.isArray(rows)
      ? rows.filter((row): row is LeadItem => Boolean(asRecord(row)))
      : [];
    return {
      status: typeof rec.status === "string" ? rec.status : undefined,
      items,
      observed: rec.observed,
      rawObject: rec,
    };
  } catch {
    return null;
  }
}

export function textOutputKey(raw: string): string {
  return `text:${createHash("sha1").update(raw).digest("hex")}`;
}

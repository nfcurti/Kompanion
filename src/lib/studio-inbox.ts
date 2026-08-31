export type StudioActivityKind = "routine" | "capability" | "agent";

export type StudioMessageMeta = {
  origin: StudioActivityKind;
  title?: string;
  agentName?: string;
};

export type StudioInboxItem = {
  id: string;
  kind: StudioActivityKind;
  title: string;
  agentId?: string;
  agentName?: string;
  output: string;
  createdAt: string;
};

export function speakerLabel(meta?: StudioMessageMeta | null): string {
  if (!meta) return "Studio";
  if (meta.origin === "routine") {
    return meta.agentName
      ? `${meta.agentName} · Routine`
      : meta.title
        ? `Routine · ${meta.title}`
        : "Routine";
  }
  if (meta.origin === "capability") {
    return meta.title ? `Capability · ${meta.title}` : "Capability";
  }
  return meta.agentName ?? "Agent";
}

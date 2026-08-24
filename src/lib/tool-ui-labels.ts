export function formatStartedAgo(elapsedMs: number): string {
  const totalSec = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `Started ${String(minutes).padStart(2, "0")} m ${String(seconds).padStart(2, "0")} sec ago`;
}

export function looksLikeMarkdown(text: string): boolean {
  if (/^#{1,6}\s/m.test(text)) return true;
  if (/\*\*[^*]+\*\*/.test(text)) return true;
  if (/__[^_]+__/.test(text)) return true;
  if (/^\s*[-*+]\s+\S/m.test(text)) return true;
  if (/^\s*\d+\.\s+\S/m.test(text)) return true;
  if (/\[[^\]]+\]\([^)]+\)/.test(text)) return true;
  if (/```/.test(text)) return true;
  if (/^\s*>\s+\S/m.test(text)) return true;
  return false;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function stringField(value: unknown, key: string): string | null {
  const rec = asRecord(value);
  const field = rec?.[key];
  return typeof field === "string" && field.trim() ? field.trim() : null;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export function isSupervisorToolDone(
  state?: string,
  preliminary?: boolean,
  output?: unknown,
): boolean {
  if (state === "output-error" || state === "output-denied") return true;
  if (asRecord(output)?.complete === true) return true;
  return state === "output-available" && !preliminary;
}

export function supervisorToolBadge(
  state?: string,
  preliminary?: boolean,
  output?: unknown,
): string {
  if (state === "output-error" || state === "output-denied") return "error";
  if (isSupervisorToolDone(state, preliminary, output)) return "done";
  return "running";
}

function invokeAgentPhrase(options: {
  input?: unknown;
  output?: unknown;
  agentName?: string | null;
  done: boolean;
}): string {
  const agent =
    options.agentName?.trim() ||
    stringField(options.output, "agentName") ||
    stringField(options.input, "agentId") ||
    stringField(options.output, "agentId") ||
    "a specialist";
  const task = stringField(options.input, "task");
  const detail = task ? `: ${truncate(task, 72)}` : "";
  if (options.done) return `Ran ${agent}${detail}`;
  return `Running ${agent}${detail}`;
}

export function supervisorToolLabel(options: {
  name: string;
  input?: unknown;
  output?: unknown;
  state?: string;
  preliminary?: boolean;
  agentName?: string | null;
}): string {
  const done = isSupervisorToolDone(options.state, options.preliminary, options.output);
  const error =
    stringField(options.output, "error") ||
    (options.state === "output-error"
      ? "Specialist run failed"
      : null);

  if (options.name === "invokeAgent") {
    if (error && done) return error;
    if (!done) {
      const step = stringField(options.output, "step");
      if (step) return step;
    }
    return invokeAgentPhrase({
      input: options.input,
      output: options.output,
      agentName: options.agentName,
      done,
    });
  }

  if (options.name === "listAgents") {
    return done ? "Checked the agent fleet" : "Checking the agent fleet";
  }

  return options.name;
}

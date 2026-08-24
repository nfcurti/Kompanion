import { APICallError, generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { languageModel, modelProvider, resolvedModelId } from "@/lib/language-model";
import { recordUsage, recordUsageFromGenerate } from "@/lib/usage";

export const maxDuration = 60;

const generateSkillSchema = z.object({
  id: z.string().trim().max(64).optional(),
  description: z.string().trim().min(1).max(1024),
});

export async function POST(request: Request) {
  const startedAt = Date.now();
  const modelId = resolvedModelId();

  try {
    const body = await request.json();
    const { id, description } = generateSkillSchema.parse(body);

    const result = await generateText({
      model: languageModel(modelId),
      system: `You write agent skills in Markdown.

Output ONLY the skill body (no YAML frontmatter, no wrapping code fences).

Structure:
# <Title>

## Instructions
Step-by-step procedure. Ground URLs and the entity to collect (e.g. job openings) in the user's description. Do not freeze a field list unless the user named one. Prefer bullets. Do not pad with generic advice.

## Examples
3 compact JSON outcomes (not Markdown tables). Keys on each item must differ across examples so the skill does not imply a fixed schema. Do not invent site paths (no fake /jobs/123 URLs).

## Guardrails
Fail-closed rules.

Authoring rules:
- Imperative instructions to the agent. Use the given skill id in every tool call.
- The agent's reply to the user is a single JSON object, no Markdown table, no prose wrapper. Shape:
  {"status":"ok"|"no_results"|"incomplete","items":[...],"observed":{...}}
  - items: one object per collected record (job, listing, row). Each object includes every label/value visible for that record (title, budget, dates, tags, owner, counts, hrefs taken from the page, etc.). Omit keys that are not on that record. Keys may differ between items. Do not pad with "not listed". Do not invent keys or values.
  - observed: {url, tools, verified, missing} — required when status is not ok; optional otherwise.
- Do not declare required columns in the skill body. Describe the record type and that the JSON schema follows the page. Only pin fields if the user listed them.
- status "ok" only if items were taken from a page that actually shows those records. An empty items array with status "ok" is allowed only when that listings/results view was open and showed zero records. Homepage, login, or account-home is "incomplete", not "ok" with empty fields.
- If the task cannot be completed, still return the JSON envelope (status incomplete, items [], observed filled). Do not replace that with a conversational apology.
- Platform tools only — never Playwright scripts, undocumented APIs, or invented endpoints.
  - HTML: skillLogin({ skillId }) then skillFetch({ skillId, url }).
  - JS / SPA / HTTP login still showing a password field: skillBrowserOpen({ skillId, login: true, url }) then skillBrowserSnapshot / skillBrowserAct (click | fill | press | goto) / skillBrowserClose. Always pass the task URL as url when it is known.
  - Credentials live on the skill. Never ask for or print passwords.
  - skillLogin cookies are not the Chromium session. Tool results include requestedUrl vs url. If reachedRequestedUrl is false, the agent is on the wrong page (often an account home after login) and must navigate to the canonical URL before extracting data.
- Public/canonical URLs from the description first. Do not invent, guess, or reconstruct other paths (search pages, listing URLs, filters, pagination). After the first real page, reach further pages only by following links, buttons, menus, or forms visible in the fetch body or browser snapshot (skillFetch that url, or skillBrowserAct click/goto on a URL taken from the page). If a needed link is not on the page, fail closed — do not invent a URL.
- Log in only when the needed content is gated and the user is entitled to it. Do not skip login if the description implies a saved account.
- Do not treat a successful login or a 200 fetch as task success. Keep fetching/navigating until the target content is in a fetch body or snapshot, or linked pages on the same host are exhausted. Do not skillBrowserClose until then.
- No captchas, paywalls without credentials, or access-control bypass.
- Keep the skill token-efficient.`,

      prompt: `Write a skill body for this skill.

${id ? `Skill id: ${id}\n` : ""}Description (what & when):
${description}

If the description names URLs, put those in Instructions. Unless the user specified a result schema, the skill must tell the agent to return JSON items whose keys are whatever that record shows on the site.`,
      abortSignal: request.signal,
    });

    recordUsageFromGenerate({
      source: "skills.generate",
      action: id ? `Generate skill · ${id}` : "Generate skill",
      status: "ok",
      provider: modelProvider(),
      model: modelId,
      durationMs: Date.now() - startedAt,
      result,
    });

    const instructions = result.text.trim();
    if (!instructions) {
      return NextResponse.json(
        { error: "Model returned empty instructions." },
        { status: 502 },
      );
    }

    return NextResponse.json({ instructions });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Add a description first.", details: error.flatten() },
        { status: 400 },
      );
    }
    recordUsage({
      source: "skills.generate",
      action: "Generate skill",
      status: "error",
      provider: modelProvider(),
      model: modelId,
      inputTokens: 0,
      outputTokens: 0,
      cachedInputTokens: 0,
      cacheWriteTokens: 0,
      reasoningTokens: 0,
      totalTokens: 0,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Request failed",
    });
    console.error("skill generate failed", error);
    if (APICallError.isInstance(error)) {
      const status =
        error.statusCode && error.statusCode >= 400 && error.statusCode < 600
          ? error.statusCode
          : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json(
      { error: "Failed to generate skill instructions." },
      { status: 500 },
    );
  }
}

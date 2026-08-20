# Kompanion

AI chat orchestrator for multi-agent workflows. Built with Next.js, AI SDK, and
shadcn/ui.

## Getting started

```bash
npm install
cp .env.example .env.local
# set AI_GATEWAY_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Workspace

| Path | Purpose |
| --- | --- |
| `/playground` | Studio — chat with the orchestrator |
| `/continuous-actions` | Continuous actions — scheduled and triggered jobs |
| `/agents` | Agent registry |
| `/skills` | Reusable instruction packs agents can attach |
| `/settings` | Platform configuration |

## Skills

Skills are like agent skills: an id, a when-to-use description, and a markdown
instructions body. Create them under **Skills**, then attach them when creating
an agent (the agent “capabilities” picker only lists existing skills).

## Registering an agent

The registry starts empty. From the UI, or from server code:

```ts
import { registerAgent } from "@/agents";

registerAgent({
  id: "my-agent",
  name: "My Agent",
  description: "Does one job well",
  status: "active",
  capabilities: ["web-search"], // skill ids
  createTools: () => ({
    // AI SDK tools
  }),
});
```

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint

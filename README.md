# Kompanion

Scaffold for an AI chat orchestrator that can run multiple agents. Built with Next.js, AI SDK, and shadcn/ui.

## Stack

- **Next.js** App Router + Tailwind CSS
- **AI SDK** (`ToolLoopAgent` + `useChat`) with GPT via Vercel AI Gateway
- **shadcn/ui** (light / dark / system)

## Getting started

```bash
npm install
cp .env.example .env.local
# set AI_GATEWAY_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → redirects to `/playground`.

## Routes

| Path | Purpose |
| --- | --- |
| `/playground` | Orchestrator chat + activity inspector |
| `/automations` | Workflows (empty until you add them) |
| `/agents` | Agent registry UI |
| `/runs` | Run history (empty until persistence) |
| `/settings` | Model / theme / flags |

## Registering an agent

The registry starts empty. From server code:

```ts
import { registerAgent } from "@/agents";

registerAgent({
  id: "my-agent",
  name: "My Agent",
  description: "Does one job well",
  status: "active",
  capabilities: ["example"],
  createTools: () => ({
    // AI SDK tools
  }),
});
```

Active agents’ tools are merged into the orchestrator automatically.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint

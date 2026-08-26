# Kompanion

Chat with a team of agents. Teach them capabilities, then ask once in Studio or
set a routine that keeps going.

## Getting started

```bash
npm install
cp .env.example .env.local
# set OPENAI_API_KEY (https://platform.openai.com/api-keys)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Workspace

| Path | Purpose |
| --- | --- |
| `/playground` | Studio — ask once |
| `/routines` | Routines — work that keeps happening |
| `/agents` | Your agents |
| `/capabilities` | What agents know how to do |
| `/settings` | Workspace defaults |

## Capabilities

A capability is how an agent does one kind of work: a name, when to use it, and
instructions. Create them under **Capabilities**, then give them to an agent.

When you ask in Studio:
1. Studio looks at your Active agents
2. It asks the matching agent to help
3. That agent follows the capabilities you attached

## Registering an agent

The list starts empty. From the UI, or from server code:

```ts
import { registerAgent } from "@/agents";

registerAgent({
  id: "my-agent",
  name: "My Agent",
  description: "Does one job well",
  status: "active",
  capabilities: ["web-search"], // capability ids
  createTools: () => ({
    // AI SDK tools
  }),
});
```

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint

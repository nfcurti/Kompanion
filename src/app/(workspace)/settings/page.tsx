"use client";

import { ORCHESTRATOR_MODEL } from "@/agents/orchestrator";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Workspace defaults for the orchestrator. Secrets stay in env vars —
            nothing sensitive is stored in the browser.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Model</CardTitle>
            <CardDescription>
              Routed through Vercel AI Gateway. Change the constant in{" "}
              <span className="font-mono">src/agents/orchestrator.ts</span> to
              switch models.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="model">Default orchestrator model</FieldLabel>
                <Input
                  id="model"
                  value={ORCHESTRATOR_MODEL}
                  readOnly
                  className="font-mono"
                />
                <FieldDescription>
                  Currently fixed in code. UI editing lands with persisted config.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gateway</CardTitle>
            <CardDescription>
              Authenticate with <span className="font-mono">AI_GATEWAY_API_KEY</span>{" "}
              in <span className="font-mono">.env.local</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">AI Gateway</p>
                <p className="text-sm text-muted-foreground">
                  Required for playground chat.
                </p>
              </div>
              <Badge variant="outline">Env-backed</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Direct OpenAI key</p>
                <p className="text-sm text-muted-foreground">
                  Optional fallback — prefer Gateway.
                </p>
              </div>
              <Badge variant="secondary">Unused</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Theme follows system by default.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">
                Light, dark, or system via the toggle.
              </p>
            </div>
            <ThemeToggle />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orchestration</CardTitle>
            <CardDescription>
              Behavior flags for when specialists come online.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Auto-delegate to active agents</p>
                <p className="text-sm text-muted-foreground">
                  Let the orchestrator choose tools without confirmation.
                </p>
              </div>
              <Switch defaultChecked disabled />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Show tool traces in Activity</p>
                <p className="text-sm text-muted-foreground">
                  Stream tool input/output into the inspector.
                </p>
              </div>
              <Switch defaultChecked disabled />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

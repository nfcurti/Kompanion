"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { defaultPlatformSettings } from "@/lib/settings";
import { CircleAlertIcon } from "lucide-react";

const settings = defaultPlatformSettings;

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure models, orchestration limits, threads, storage, and
              API access. Secrets stay in env vars — nothing sensitive is stored
              in the browser.
            </p>
          </div>

        <Alert>
          <CircleAlertIcon />
          <AlertTitle>Not persisted yet</AlertTitle>
          <AlertDescription>
            These controls show the intended configuration surface. Saving to
            storage comes next; until then values are defaults.
          </AlertDescription>
        </Alert>

        <Tabs
          defaultValue="general"
          orientation="vertical"
          className="flex flex-col gap-6 lg:flex-row"
        >
          <TabsList
            variant="line"
            className="h-auto w-full shrink-0 flex-row flex-wrap justify-start lg:w-48"
          >
            <TabsTrigger value="general" className="justify-start">
              General
            </TabsTrigger>
            <TabsTrigger value="model" className="justify-start">
              Model & gateway
            </TabsTrigger>
            <TabsTrigger value="graph" className="justify-start">
              Graph
            </TabsTrigger>
            <TabsTrigger value="agents" className="justify-start">
              Agents
            </TabsTrigger>
            <TabsTrigger value="threads" className="justify-start">
              Threads
            </TabsTrigger>
            <TabsTrigger value="runs" className="justify-start">
              Runs & tracing
            </TabsTrigger>
            <TabsTrigger value="store" className="justify-start">
              Store
            </TabsTrigger>
            <TabsTrigger value="cron" className="justify-start">
              Continuous actions
            </TabsTrigger>
            <TabsTrigger value="api" className="justify-start">
              API & auth
            </TabsTrigger>
            <TabsTrigger value="appearance" className="justify-start">
              Appearance
            </TabsTrigger>
          </TabsList>

          <div className="min-w-0 flex-1">
            <TabsContent value="general" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>General</CardTitle>
                  <CardDescription>
                    Workspace identity and default Studio experience.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="workspace-name">
                        Workspace name
                      </FieldLabel>
                      <Input
                        id="workspace-name"
                        value={settings.general.workspaceName}
                        readOnly
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="studio-mode">
                        Default Studio mode
                      </FieldLabel>
                      <Select
                        value={settings.general.defaultStudioMode}
                        disabled
                      >
                        <SelectTrigger id="studio-mode" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="chat">Chat</SelectItem>
                            <SelectItem value="graph">Graph</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        Chat is available now. Graph view is for step-by-step
                        run inspection later.
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="model" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Model & gateway</CardTitle>
                  <CardDescription>
                    Default model for the orchestrator. Authenticate with{" "}
                    <span className="font-mono">AI_GATEWAY_API_KEY</span>.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="model-id">Model</FieldLabel>
                      <Input
                        id="model-id"
                        value={settings.model.modelId}
                        readOnly
                        className="font-mono"
                      />
                      <FieldDescription>
                        Change in{" "}
                        <span className="font-mono">
                          src/agents/orchestrator.ts
                        </span>{" "}
                        until settings persistence exists.
                      </FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="temperature">Temperature</FieldLabel>
                      <Input
                        id="temperature"
                        type="number"
                        value={settings.model.temperature}
                        readOnly
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="max-tokens">
                        Max output tokens
                      </FieldLabel>
                      <Input
                        id="max-tokens"
                        type="number"
                        value={settings.model.maxOutputTokens}
                        readOnly
                      />
                    </Field>
                  </FieldGroup>
                  <Separator className="my-2" />
                  <SettingRow
                    label="Vercel AI Gateway"
                    description="Route openai/* model strings through the gateway."
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Env-backed</Badge>
                      <Switch
                        checked={settings.model.gatewayEnabled}
                        disabled
                      />
                    </div>
                  </SettingRow>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="graph" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Graph</CardTitle>
                  <CardDescription>
                    How far a single run can go — step limits and streaming
                    behavior for the orchestrator loop.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="recursion-limit">
                        Recursion limit
                      </FieldLabel>
                      <Input
                        id="recursion-limit"
                        type="number"
                        value={settings.graph.recursionLimit}
                        readOnly
                      />
                      <FieldDescription>
                        Max tool and agent steps per run before the loop stops.
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                  <Separator className="my-2" />
                  <SettingRow
                    label="Stream tokens"
                    description="Stream assistant tokens to Studio as they generate."
                  >
                    <Switch checked={settings.graph.streamTokens} disabled />
                  </SettingRow>
                  <Separator />
                  <SettingRow
                    label="Parallel tool calls"
                    description="Allow multiple tools in one step when the model requests them."
                  >
                    <Switch
                      checked={settings.graph.parallelToolCalls}
                      disabled
                    />
                  </SettingRow>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agents" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Agents</CardTitle>
                  <CardDescription>
                    Defaults for how specialist agents connect to the
                    orchestrator.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="default-status">
                        Default status on register
                      </FieldLabel>
                      <Select
                        value={settings.agents.defaultStatusOnRegister}
                        disabled
                      >
                        <SelectTrigger id="default-status" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="planned">planned</SelectItem>
                            <SelectItem value="registered">
                              registered
                            </SelectItem>
                            <SelectItem value="active">active</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldGroup>
                  <Separator className="my-2" />
                  <SettingRow
                    label="Auto-delegate"
                    description="Let the orchestrator call active agent tools without confirmation."
                  >
                    <Switch checked={settings.agents.autoDelegate} disabled />
                  </SettingRow>
                  <Separator />
                  <SettingRow
                    label="Require tool approval"
                    description="Pause the run when a tool needs human approval (HITL)."
                  >
                    <Switch
                      checked={settings.agents.requireToolApproval}
                      disabled
                    />
                  </SettingRow>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="threads" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Threads</CardTitle>
                  <CardDescription>
                    Conversation state across messages. When persistence is on,
                    later turns can continue from prior context.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  <SettingRow
                    label="Persistence"
                    description="Store thread state across requests. Off = ephemeral Studio sessions."
                  >
                    <Switch
                      checked={settings.threads.persistenceEnabled}
                      disabled
                    />
                  </SettingRow>
                  <Separator />
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="thread-ttl">TTL (days)</FieldLabel>
                      <Input
                        id="thread-ttl"
                        type="number"
                        value={settings.threads.ttlDays}
                        readOnly
                      />
                      <FieldDescription>
                        Auto-expire inactive threads when persistence is on.
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                  <Separator className="my-2" />
                  <SettingRow
                    label="Allow fork"
                    description="Branch a thread from an earlier point to retry or debug."
                  >
                    <Switch checked={settings.threads.allowFork} disabled />
                  </SettingRow>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="runs" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Runs & tracing</CardTitle>
                  <CardDescription>
                    A run is one orchestrator execution. Studio and Continuous
                    actions both create runs you can inspect later.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="retain-days">
                        Retain runs (days)
                      </FieldLabel>
                      <Input
                        id="retain-days"
                        type="number"
                        value={settings.runs.retainDays}
                        readOnly
                      />
                    </Field>
                  </FieldGroup>
                  <Separator className="my-2" />
                  <SettingRow
                    label="Capture tool traces"
                    description="Record tool input/output in the Activity inspector and Runs."
                  >
                    <Switch
                      checked={settings.runs.captureToolTraces}
                      disabled
                    />
                  </SettingRow>
                  <Separator />
                  <SettingRow
                    label="Capture errors"
                    description="Keep failed run payloads for debugging."
                  >
                    <Switch checked={settings.runs.captureErrors} disabled />
                  </SettingRow>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="store" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Store</CardTitle>
                  <CardDescription>
                    Shared memory across threads for long-lived context.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  <SettingRow
                    label="Durable state"
                    description="Keep run state across steps and restarts."
                  >
                    <Switch
                      checked={settings.store.checkpointerEnabled}
                      disabled
                    />
                  </SettingRow>
                  <Separator className="my-2" />
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="store-ns">Namespace</FieldLabel>
                      <Input
                        id="store-ns"
                        value={settings.store.namespace}
                        readOnly
                        className="font-mono"
                      />
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cron" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Continuous actions</CardTitle>
                  <CardDescription>
                    Defaults for scheduled and triggered orchestrator jobs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="cron-tz">Timezone</FieldLabel>
                      <Input
                        id="cron-tz"
                        value={settings.cron.timezone}
                        readOnly
                        className="font-mono"
                      />
                      <FieldDescription>
                        Schedules are interpreted in this timezone (UTC by
                        default).
                      </FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="on-complete">
                        On run completed
                      </FieldLabel>
                      <Select value={settings.cron.onRunCompleted} disabled>
                        <SelectTrigger id="on-complete" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="keep">
                              keep thread
                            </SelectItem>
                            <SelectItem value="delete">
                              delete thread
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        Whether threads created by continuous actions are kept
                        after the run.
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>API & auth</CardTitle>
                  <CardDescription>
                    Programmatic access to threads, runs, and continuous
                    actions outside of Studio.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  <SettingRow
                    label="Public API"
                    description="Expose REST endpoints beyond Studio chat."
                  >
                    <Switch
                      checked={settings.api.publicApiEnabled}
                      disabled
                    />
                  </SettingRow>
                  <Separator className="my-2" />
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="rate-limit">
                        Rate limit (req/min)
                      </FieldLabel>
                      <Input
                        id="rate-limit"
                        type="number"
                        value={settings.api.rateLimitPerMinute}
                        readOnly
                      />
                    </Field>
                  </FieldGroup>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between gap-4 py-2">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">AI Gateway key</p>
                      <p className="text-sm text-muted-foreground">
                        Loaded from{" "}
                        <span className="font-mono">.env.local</span>
                      </p>
                    </div>
                    <Badge variant="outline">Env-backed</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Theme for Studio and the rest of the workspace.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SettingRow
                    label="Theme"
                    description="Light, dark, or follow system."
                  >
                    <ThemeToggle />
                  </SettingRow>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

"use client";

import { CircleAlertIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ModelDropdown } from "@/components/settings/model-dropdown";
import { ThemeCustomizerPanel } from "@/components/theme-customizer";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/workspace/page-header";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { defaultPlatformSettings } from "@/lib/settings";

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
  const { modelId, saveModelId } = useWorkspace();
  const [savingModel, setSavingModel] = useState(false);

  async function onModelChange(next: string) {
    if (next === modelId || savingModel) return;
    setSavingModel(true);
    try {
      await saveModelId(next);
      toast.success("Model saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save model");
    } finally {
      setSavingModel(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
        <PageHeader
          title="Settings"
          description="Model, conversations, look and feel, and access. API keys stay in your environment. Nothing sensitive is stored in the browser."
        />

        <Alert>
          <CircleAlertIcon />
          <AlertTitle>Saving isn’t available yet</AlertTitle>
          <AlertDescription>
            These settings are a preview of what’s coming. Saving isn’t wired
            up yet, so you’re seeing defaults.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="workspace" className="flex flex-col gap-6">
          <TabsList variant="line" className="h-auto w-full flex-wrap justify-start">
            <TabsTrigger value="workspace">Workspace</TabsTrigger>
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="workspace" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Workspace</CardTitle>
                <CardDescription>
                  Identity, default Studio experience, and routine timezone.
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
                          <SelectItem value="graph">Steps</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Chat is available now. A step-by-step view of a run
                      comes later.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="cron-tz">Routine timezone</FieldLabel>
                    <Input
                      id="cron-tz"
                      value={settings.cron.timezone}
                      readOnly
                      className="font-mono"
                    />
                    <FieldDescription>
                      Times are read in this timezone (UTC by default).
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="on-complete">After a routine run</FieldLabel>
                    <Select value={settings.cron.onRunCompleted} disabled>
                      <SelectTrigger id="on-complete" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="keep">Keep history</SelectItem>
                          <SelectItem value="delete">Delete history</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Whether a routine’s history is kept after it finishes.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="model" className="mt-0 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Model</CardTitle>
                <CardDescription>
                  Default model for Studio and agents. Sign in with your{" "}
                  <span className="font-mono">OPENAI_API_KEY</span>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="model-id">Model</FieldLabel>
                    <ModelDropdown
                      id="model-id"
                      value={modelId}
                      disabled={savingModel}
                      onChange={(value) => void onModelChange(value)}
                    />
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
                <SettingRow
                  label="OpenAI API"
                  description="Calls go to api.openai.com with OPENAI_API_KEY."
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Env-backed</Badge>
                    <Switch checked={settings.model.openaiEnabled} disabled />
                  </div>
                </SettingRow>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Limits</CardTitle>
                <CardDescription>
                  How far a single request can go before it stops.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="recursion-limit">Max steps</FieldLabel>
                    <Input
                      id="recursion-limit"
                      type="number"
                      value={settings.graph.recursionLimit}
                      readOnly
                    />
                    <FieldDescription>
                      Maximum steps an agent can take in one run.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
                <SettingRow
                  label="Stream tokens"
                  description="Show Studio replies as they are written."
                >
                  <Switch checked={settings.graph.streamTokens} disabled />
                </SettingRow>
                <SettingRow
                  label="Several steps at once"
                  description="Let an agent do more than one action in the same moment."
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
                  How new agents start, and whether Studio can ask them
                  without extra confirmation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="default-status">
                      Status for new agents
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
                          <SelectItem value="registered">registered</SelectItem>
                          <SelectItem value="active">active</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
                <SettingRow
                  label="Ask agents automatically"
                  description="Let Studio send work to Active agents without asking you first."
                >
                  <Switch checked={settings.agents.autoDelegate} disabled />
                </SettingRow>
                <SettingRow
                  label="Ask before acting"
                  description="Pause when an agent is about to do something that needs your OK."
                >
                  <Switch
                    checked={settings.agents.requireToolApproval}
                    disabled
                  />
                </SettingRow>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversations" className="mt-0 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversations</CardTitle>
                <CardDescription>
                  Whether Studio remembers a chat after you leave.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SettingRow
                  label="Persistence"
                  description="Keep Studio chats after you close the tab. Off means each session is forgotten."
                >
                  <Switch
                    checked={settings.threads.persistenceEnabled}
                    disabled
                  />
                </SettingRow>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="thread-ttl">Keep for (days)</FieldLabel>
                    <Input
                      id="thread-ttl"
                      type="number"
                      value={settings.threads.ttlDays}
                      readOnly
                    />
                    <FieldDescription>
                      Unused chats are removed after this many days, if
                      remembering is on.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
                <SettingRow
                  label="Allow branching"
                  description="Start a new chat from an earlier message to try a different approach."
                >
                  <Switch checked={settings.threads.allowFork} disabled />
                </SettingRow>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>History</CardTitle>
                <CardDescription>
                  A run is one time Studio or a routine asked an agent to
                  work. You can inspect those later.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="retain-days">
                      Keep history (days)
                    </FieldLabel>
                    <Input
                      id="retain-days"
                      type="number"
                      value={settings.runs.retainDays}
                      readOnly
                    />
                  </Field>
                </FieldGroup>
                <SettingRow
                  label="Keep step details"
                  description="Save what the agent did, so you can review it in Activity."
                >
                  <Switch
                    checked={settings.runs.captureToolTraces}
                    disabled
                  />
                </SettingRow>
                <SettingRow
                  label="Keep errors"
                  description="Save failed runs so you can see what went wrong."
                >
                  <Switch checked={settings.runs.captureErrors} disabled />
                </SettingRow>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Memory</CardTitle>
                <CardDescription>
                  Longer-lived notes an agent can use across conversations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SettingRow
                  label="Remember across restarts"
                  description="Keep progress if a long job is interrupted."
                >
                  <Switch
                    checked={settings.store.checkpointerEnabled}
                    disabled
                  />
                </SettingRow>
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

          <TabsContent value="access" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Access</CardTitle>
                <CardDescription>
                  Let other apps talk to Kompanion besides Studio.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SettingRow
                  label="Public API"
                  description="Allow requests from outside this workspace."
                >
                  <Switch
                    checked={settings.api.publicApiEnabled}
                    disabled
                  />
                </SettingRow>
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
                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">OpenAI API key</p>
                    <p className="text-sm text-muted-foreground">
                      Loaded from{" "}
                      <span className="font-mono">OPENAI_API_KEY</span> in{" "}
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
                  Style, background, colors, radius, and charts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeCustomizerPanel className="max-w-xs" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

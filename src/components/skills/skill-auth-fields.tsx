"use client";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { SkillAuth } from "@/lib/skills";

export type SkillAuthDraft = {
  enabled: boolean;
  loginUrl: string;
  username: string;
  password: string;
  allowedHosts: string;
};

export function skillAuthToDraft(auth: SkillAuth | undefined): SkillAuthDraft {
  return {
    enabled: Boolean(auth?.enabled),
    loginUrl: auth?.loginUrl ?? "",
    username: auth?.username ?? "",
    password: auth?.password ?? "",
    allowedHosts: (auth?.allowedHosts ?? []).join(", "),
  };
}

export function draftToSkillAuth(draft: SkillAuthDraft): SkillAuth | undefined {
  if (!draft.enabled) return undefined;
  const allowedHosts = draft.allowedHosts
    .split(/[,\s]+/)
    .map((host) => host.trim())
    .filter(Boolean);
  return {
    enabled: true,
    loginUrl: draft.loginUrl.trim(),
    username: draft.username.trim(),
    password: draft.password,
    allowedHosts: allowedHosts.length > 0 ? allowedHosts : undefined,
  };
}

export function SkillAuthFields({
  value,
  onChange,
  passwordHint,
}: {
  value: SkillAuthDraft;
  onChange: (next: SkillAuthDraft) => void;
  passwordHint?: string;
}) {
  return (
    <FieldGroup>
      <div className="flex items-start justify-between gap-4 py-1">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-sm font-medium">Site login</p>
          <p className="text-sm text-muted-foreground">
            Agents can sign in with these credentials via skillLogin (HTML)
            or skillBrowserOpen (JavaScript sites), then read pages with
            skillFetch or skillBrowserSnapshot.
          </p>
        </div>
        <Switch
          checked={value.enabled}
          onCheckedChange={(enabled) => onChange({ ...value, enabled })}
          aria-label="Enable site login"
        />
      </div>
      {value.enabled ? (
        <>
          <Field>
            <FieldLabel htmlFor="skill-login-url">Login URL</FieldLabel>
            <Input
              id="skill-login-url"
              type="url"
              value={value.loginUrl}
              onChange={(event) =>
                onChange({ ...value, loginUrl: event.target.value })
              }
              placeholder="https://www.freelancedev.it/login"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="skill-login-username">Username or email</FieldLabel>
            <Input
              id="skill-login-username"
              value={value.username}
              onChange={(event) =>
                onChange({ ...value, username: event.target.value })
              }
              autoComplete="off"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="skill-login-password">Password</FieldLabel>
            <Input
              id="skill-login-password"
              type="password"
              value={value.password}
              onChange={(event) =>
                onChange({ ...value, password: event.target.value })
              }
              autoComplete="new-password"
              required={!passwordHint}
            />
            {passwordHint ? (
              <FieldDescription>{passwordHint}</FieldDescription>
            ) : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="skill-login-hosts">Allowed hosts</FieldLabel>
            <Input
              id="skill-login-hosts"
              value={value.allowedHosts}
              onChange={(event) =>
                onChange({ ...value, allowedHosts: event.target.value })
              }
              placeholder="www.freelancedev.it, freelancedev.it"
            />
            <FieldDescription>
              Optional extra hosts. The login URL host is always allowed.
            </FieldDescription>
          </Field>
        </>
      ) : null}
    </FieldGroup>
  );
}

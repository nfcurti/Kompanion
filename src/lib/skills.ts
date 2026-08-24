export type SkillAuth = {
  enabled: boolean;
  loginUrl: string;
  username: string;
  password: string;
  /** Extra hosts this skill may request, in addition to the login URL host. */
  allowedHosts?: string[];
};

export type Skill = {
  id: string;
  name: string;
  /** Short description — used for discovery (when to apply). */
  description: string;
  /** Markdown instructions body, like a SKILL.md. */
  instructions: string;
  /** Optional site login used by the bound agent's skill tools, not by Studio. */
  auth?: SkillAuth;
};

export function skillHasLogin(skill: Skill): boolean {
  return Boolean(
    skill.auth?.enabled &&
      skill.auth.loginUrl.trim() &&
      skill.auth.username.trim() &&
      skill.auth.password,
  );
}

export function normalizeSkillAuth(
  input: SkillAuth | undefined,
): SkillAuth | undefined {
  if (!input?.enabled) return undefined;
  const loginUrl = input.loginUrl.trim();
  const username = input.username.trim();
  const password = input.password;
  if (!loginUrl || !username || !password) return undefined;
  const allowedHosts = [
    ...new Set(
      (input.allowedHosts ?? [])
        .map((host) => host.trim().toLowerCase().replace(/^https?:\/\//, ""))
        .map((host) => host.split("/")[0] ?? "")
        .filter(Boolean),
    ),
  ];
  return {
    enabled: true,
    loginUrl,
    username,
    password,
    allowedHosts: allowedHosts.length > 0 ? allowedHosts : undefined,
  };
}

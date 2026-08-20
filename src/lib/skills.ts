export type Skill = {
  id: string;
  name: string;
  /** Short description — used for discovery (when to apply). */
  description: string;
  /** Markdown instructions body, like a SKILL.md. */
  instructions: string;
};

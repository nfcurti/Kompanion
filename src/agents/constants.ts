/** Default model for the orchestrator (OpenAI API). */
export const ORCHESTRATOR_MODEL = "openai/gpt-5.5";

export const OPENAI_MODELS = [
  {
    id: "openai/gpt-5.5",
    label: "GPT-5.5",
    hint: "Flagship",
  },
  {
    id: "openai/gpt-5.5-pro",
    label: "GPT-5.5 Pro",
    hint: "Highest quality",
  },
  {
    id: "openai/gpt-5.4",
    label: "GPT-5.4",
    hint: "Workhorse",
  },
  {
    id: "openai/gpt-5.4-mini",
    label: "GPT-5.4 Mini",
    hint: "Cheaper",
  },
  {
    id: "openai/gpt-5.4-nano",
    label: "GPT-5.4 Nano",
    hint: "Fast / cheap",
  },
  {
    id: "openai/gpt-5.4-pro",
    label: "GPT-5.4 Pro",
    hint: "High capability",
  },
] as const;

export type OpenAIModelId = (typeof OPENAI_MODELS)[number]["id"];

export function isOpenAIModelId(value: string): value is OpenAIModelId {
  return OPENAI_MODELS.some((model) => model.id === value);
}

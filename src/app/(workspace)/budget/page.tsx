import { UsageDashboard } from "@/components/usage/usage-dashboard";

export default function BudgetPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Budget & Costs
          </h1>
          <p className="text-sm text-muted-foreground">
            Token usage for every AI request billed to your OpenAI API key —
            input, output, cached prompt tokens, and estimated cost.
          </p>
        </div>
        <UsageDashboard />
      </div>
    </div>
  );
}

import { UsageDashboard } from "@/components/usage/usage-dashboard";
import { PageHeader } from "@/components/workspace/page-header";

export default function BudgetPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
        <PageHeader
          title="Budget"
          description="Token use for conversations and routines billed to your OpenAI key, with an estimated cost."
        />
        <UsageDashboard />
      </div>
    </div>
  );
}

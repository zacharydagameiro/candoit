import { Button } from "@/components/ui/button"
import { useAppLayout } from "@/hooks/use-app-layout"

const dashboardStats = [
  {
    label: "Materials Scoped",
    value: "7",
    note: "Bottle, label, formula, flavor lab, co-packer, carton, logistics.",
  },
  {
    label: "Suppliers Shortlisted",
    value: "18",
    note: "Canada-first search across manufacturing, packaging, and formulation.",
  },
  {
    label: "Ready To Contact",
    value: "6",
    note: "High-fit suppliers prepared for RFQ and intro outreach.",
  },
  {
    label: "Responses Pending",
    value: "3",
    note: "Waiting on sample timing, MOQ details, and pricing confirmations.",
  },
]

const nextActions = [
  "Finalize the packaging and formulation requirements before outreach.",
  "Approve the first shortlist of beverage manufacturers and label vendors.",
  "Prepare the baseline RFQ template for automated contact workflows.",
]

export default function DashboardPage() {
  const { currentProduct } = useAppLayout()

  return (
    <div className="flex flex-1 flex-col gap-4">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Current Product</p>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {currentProduct.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {currentProduct.category}. This dashboard is the working shell for
                sourcing, outreach, and quote comparison.
              </p>
            </div>
          </div>
          <Button variant="outline">Review Supplier Pipeline</Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border bg-card p-5 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {stat.value}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {stat.note}
            </p>
          </div>
        ))}
      </section>

      <section className="grid flex-1 gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Sourcing Overview
              </h2>
              <p className="text-sm text-muted-foreground">
                Static MVP summary of how the supplier workflow will progress.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-sm font-medium">1. Decompose Product</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Break the product into packaging, ingredients, formulation, and
                production requirements.
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-sm font-medium">2. Source Suppliers</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Build a supplier directory with fit scores, location, MOQ, and
                service coverage.
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-sm font-medium">3. Automate Outreach</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Move shortlisted companies into contact workflows and collect
                responses for quote comparison.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Next Actions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The first actions the product team would take once the flow is live.
          </p>
          <div className="mt-6 space-y-3">
            {nextActions.map((action, index) => (
              <div
                key={action}
                className="rounded-xl border bg-background px-4 py-3"
              >
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-sm leading-6">{action}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

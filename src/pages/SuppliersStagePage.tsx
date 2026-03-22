import { Button } from "@/components/ui/button"
import { useAppLayout } from "@/hooks/use-app-layout"
import type { SupplierStage } from "@/lib/app-shell"

type StageConfig = {
  title: string
  description: string
  actionLabel: string
  stats: {
    label: string
    value: string
  }[]
  columns: string[]
  rows: string[][]
}

const stageContent: Record<SupplierStage, StageConfig> = {
  directory: {
    title: "Supplier Directory",
    description:
      "Review the first-pass list of suppliers that match the current product brief.",
    actionLabel: "Shortlist Top Matches",
    stats: [
      { label: "Suppliers Mapped", value: "18" },
      { label: "High-Fit Matches", value: "6" },
      { label: "Needs Research", value: "4" },
    ],
    columns: ["Supplier", "Capability", "Region", "MOQ", "Fit"],
    rows: [
      ["Northline Beverages", "Co-packing + canning", "Ontario", "25k units", "High"],
      ["PureForm Labs", "Flavor formulation", "British Columbia", "Pilot batches", "High"],
      ["Polar Pack Studio", "Label + shrink sleeves", "Quebec", "10k labels", "Medium"],
      ["MapleCap Plastics", "Bottle manufacturing", "Alberta", "50k bottles", "Medium"],
    ],
  },
  contacting: {
    title: "Contacting Suppliers",
    description:
      "Track the suppliers that are approved for first outreach and RFQ submission.",
    actionLabel: "Prepare RFQ Template",
    stats: [
      { label: "Queued For Outreach", value: "6" },
      { label: "Contact Forms Ready", value: "4" },
      { label: "Email Templates Drafted", value: "3" },
    ],
    columns: ["Supplier", "Contact Method", "Last Action", "Owner", "Status"],
    rows: [
      ["Northline Beverages", "Contact form", "RFQ drafted", "AI Agent", "Ready"],
      ["PureForm Labs", "Email", "Intro email staged", "AI Agent", "Ready"],
      ["Polar Pack Studio", "Contact form", "Form URL verified", "AI Agent", "Queued"],
      ["MapleCap Plastics", "Email", "Need pricing fields", "AI Agent", "Review"],
    ],
  },
  "awaiting-response": {
    title: "Awaiting Responses",
    description:
      "Monitor supplier replies, sample timing, MOQ details, and follow-up deadlines.",
    actionLabel: "Review Pending Replies",
    stats: [
      { label: "Pending Replies", value: "3" },
      { label: "Follow-ups Due", value: "2" },
      { label: "Quotes Expected", value: "1" },
    ],
    columns: ["Supplier", "Requested", "Last Follow-up", "SLA", "Status"],
    rows: [
      ["Northline Beverages", "MOQ + timeline", "Yesterday", "2 days", "Pending"],
      ["PureForm Labs", "Flavor sampling", "2 days ago", "1 day", "Follow up"],
      ["Polar Pack Studio", "Label pricing", "Today", "4 days", "Pending"],
      ["MapleCap Plastics", "Bottle tooling", "3 days ago", "Expired", "Escalate"],
    ],
  },
}

type SuppliersStagePageProps = {
  stage: SupplierStage
}

export default function SuppliersStagePage({
  stage,
}: SuppliersStagePageProps) {
  const { currentProduct } = useAppLayout()
  const config = stageContent[stage]

  return (
    <div className="flex flex-1 flex-col gap-4">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {currentProduct.name} supplier workflow
            </p>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {config.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {config.description}
              </p>
            </div>
          </div>
          <Button variant="outline">{config.actionLabel}</Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {config.stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border bg-card p-5 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="flex-1 rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold tracking-tight">
            {config.title} Table
          </h2>
          <p className="text-sm text-muted-foreground">
            Static placeholder content for the stage-specific supplier list.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {config.columns.map((column) => (
                  <th
                    key={column}
                    className="px-6 py-3 font-medium text-muted-foreground"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {config.rows.map((row) => (
                <tr key={row.join("-")} className="border-b last:border-b-0">
                  {row.map((value, index) => (
                    <td key={`${value}-${index}`} className="px-6 py-4 align-top">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

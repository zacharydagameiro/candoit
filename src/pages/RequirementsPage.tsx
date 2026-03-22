import { Button } from "@/components/ui/button"
import { useAppLayout } from "@/hooks/use-app-layout"

const requirementStats = [
  {
    label: "Core Inputs",
    value: "7",
    note: "Packaging, formula, flavor development, labeling, cartons, logistics, and compliance.",
  },
  {
    label: "Locked",
    value: "3",
    note: "Initial priorities already defined for the MVP sourcing workflow.",
  },
  {
    label: "Needs Clarification",
    value: "4",
    note: "Open decisions around MOQ, flavor variants, and packaging format.",
  },
]

const requirementRows = [
  ["Bottle / Can Format", "Material", "500ml PET bottle vs slim can", "Open"],
  ["Label System", "Packaging", "Shrink sleeve or pressure-sensitive label", "Open"],
  ["Base Formula", "Product", "Electrolyte + caffeine formulation", "Drafted"],
  ["Flavor Development", "R&D", "2 launch flavors and 1 backup option", "Open"],
  ["Outer Carton", "Packaging", "Retail-ready shipping carton", "Drafted"],
  ["Compliance Review", "Operational", "Ingredient and packaging review for Canada", "Locked"],
]

export default function RequirementsPage() {
  const { currentProduct } = useAppLayout()

  return (
    <div className="flex flex-1 flex-col gap-4">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {currentProduct.name} planning shell
            </p>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Product Requirements
              </h1>
              <p className="text-sm text-muted-foreground">
                Define the materials, inputs, and dependencies that need to be
                sourced before supplier outreach begins.
              </p>
            </div>
          </div>
          <Button variant="outline">Refine Inputs</Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {requirementStats.map((stat) => (
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

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">
            What belongs here
          </h2>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <div className="rounded-xl bg-muted/40 p-4">
              Materials like bottles, cans, caps, labels, cartons, and cases.
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              Product inputs like formulations, ingredients, and flavor specs.
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              Dependencies like compliance review, packaging artwork, and MOQ
              assumptions.
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold tracking-tight">
              Requirement Breakdown
            </h2>
            <p className="text-sm text-muted-foreground">
              Static placeholder table for the product decomposition step.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  {["Requirement", "Category", "Current Definition", "Status"].map(
                    (column) => (
                      <th
                        key={column}
                        className="px-6 py-3 font-medium text-muted-foreground"
                      >
                        {column}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {requirementRows.map((row) => (
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
        </div>
      </section>
    </div>
  )
}

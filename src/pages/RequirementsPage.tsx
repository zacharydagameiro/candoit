import type { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/data-table"
import { useAppLayout } from "@/hooks/use-app-layout"

type RequirementStatus = "Open" | "Drafted" | "Locked"

type RequirementRow = {
  requirement: string
  category: string
  currentDefinition: string
  status: RequirementStatus
}

const requirementRows: RequirementRow[] = [
  {
    requirement: "Bottle / Can Format",
    category: "Material",
    currentDefinition: "500ml PET bottle vs slim can",
    status: "Open",
  },
  {
    requirement: "Label System",
    category: "Packaging",
    currentDefinition: "Shrink sleeve or pressure-sensitive label",
    status: "Open",
  },
  {
    requirement: "Base Formula",
    category: "Product",
    currentDefinition: "Electrolyte + caffeine formulation",
    status: "Drafted",
  },
  {
    requirement: "Flavor Development",
    category: "R&D",
    currentDefinition: "2 launch flavors and 1 backup option",
    status: "Open",
  },
  {
    requirement: "Outer Carton",
    category: "Packaging",
    currentDefinition: "Retail-ready shipping carton",
    status: "Drafted",
  },
  {
    requirement: "Compliance Review",
    category: "Operational",
    currentDefinition: "Ingredient and packaging review for Canada",
    status: "Locked",
  },
]

const statusStyles: Record<RequirementStatus, string> = {
  Open: "border-amber-300 bg-amber-50 text-amber-800",
  Drafted: "border-blue-300 bg-blue-50 text-blue-800",
  Locked: "border-emerald-300 bg-emerald-50 text-emerald-800",
}

const requirementColumns: ColumnDef<RequirementRow>[] = [
  {
    accessorKey: "requirement",
    header: "Requirement",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "currentDefinition",
    header: "Current Definition",
    cell: ({ row }) => (
      <p className="max-w-[380px] whitespace-normal leading-6">
        {row.original.currentDefinition}
      </p>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[row.original.status]}`}
      >
        {row.original.status}
      </span>
    ),
  },
]

export default function RequirementsPage() {
  const { currentProduct } = useAppLayout()

  return (
    <div className="flex flex-1 flex-col gap-4">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          Product Requirements
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{currentProduct.name}</p>
      </section>

      <section>
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold tracking-tight">
              Requirement Breakdown
            </h2>
            <p className="text-sm text-muted-foreground">
              Structured requirement rows powered by the shadcn data table pattern.
            </p>
          </div>
          <div className="px-4 py-4 sm:px-6">
            <DataTable
              columns={requirementColumns}
              data={requirementRows}
              filterColumnId="requirement"
              filterPlaceholder="Filter requirements..."
            />
          </div>
        </div>
      </section>
    </div>
  )
}

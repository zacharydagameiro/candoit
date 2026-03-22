import type { ColumnDef } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import {
  ArchiveIcon,
  GlobeIcon,
  MailPlusIcon,
  MoreHorizontalIcon,
  TargetIcon,
} from "lucide-react"

import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppLayout } from "@/hooks/use-app-layout"

type SupplierStatus =
  | "new"
  | "ready_to_contact"
  | "contacted"
  | "replied"
  | "shortlisted"
  | "rejected"
  | "archived"

type SupplierRow = {
  id: string
  supplier: string
  capability: string
  region: string
  moq: string
  linkedRequirements: string[]
  status: SupplierStatus
  lastContacted: string
  contactUrl: string
  website: string
  fitScore: number
}

const initialSuppliers: SupplierRow[] = [
  {
    id: "s-1",
    supplier: "Polar Pack Systems",
    capability: "Packaging",
    region: "Ontario",
    moq: "15k units",
    linkedRequirements: ["Bottles for packaging", "Caps or lids"],
    status: "ready_to_contact",
    lastContacted: "Not contacted",
    contactUrl: "https://example.com/contact/polar-pack",
    website: "https://example.com/polar-pack",
    fitScore: 92,
  },
  {
    id: "s-2",
    supplier: "Blue River Formulations",
    capability: "Ingredients",
    region: "British Columbia",
    moq: "Pilot batch",
    linkedRequirements: ["Purified water", "Energy-boosting ingredients"],
    status: "contacted",
    lastContacted: "Mar 22, 10:20 AM",
    contactUrl: "https://example.com/contact/blue-river",
    website: "https://example.com/blue-river",
    fitScore: 87,
  },
  {
    id: "s-3",
    supplier: "Northline Fill & Finish",
    capability: "Production Equipment",
    region: "Quebec",
    moq: "25k units",
    linkedRequirements: ["Filling machines"],
    status: "new",
    lastContacted: "Not contacted",
    contactUrl: "https://example.com/contact/northline",
    website: "https://example.com/northline",
    fitScore: 74,
  },
  {
    id: "s-4",
    supplier: "Atlas Blending Group",
    capability: "Ingredients",
    region: "Alberta",
    moq: "10k units",
    linkedRequirements: ["Flavorings and sweeteners"],
    status: "replied",
    lastContacted: "Mar 21, 3:55 PM",
    contactUrl: "https://example.com/contact/atlas",
    website: "https://example.com/atlas",
    fitScore: 83,
  },
  {
    id: "s-5",
    supplier: "CanCraft Manufacturing",
    capability: "Packaging",
    region: "Ontario",
    moq: "40k units",
    linkedRequirements: ["Bottles for packaging", "Labels and packaging materials"],
    status: "shortlisted",
    lastContacted: "Mar 20, 2:10 PM",
    contactUrl: "https://example.com/contact/cancraft",
    website: "https://example.com/cancraft",
    fitScore: 95,
  },
]

const statusLabels: Record<SupplierStatus, string> = {
  new: "New",
  ready_to_contact: "Ready To Contact",
  contacted: "Contacted",
  replied: "Replied",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  archived: "Archived",
}

const statusStyles: Record<SupplierStatus, string> = {
  new: "border-slate-300 bg-slate-50 text-slate-700",
  ready_to_contact: "border-violet-300 bg-violet-50 text-violet-800",
  contacted: "border-blue-300 bg-blue-50 text-blue-800",
  replied: "border-emerald-300 bg-emerald-50 text-emerald-800",
  shortlisted: "border-green-400 bg-green-50 text-green-800",
  rejected: "border-rose-300 bg-rose-50 text-rose-800",
  archived: "border-zinc-300 bg-zinc-50 text-zinc-700",
}

const userSettableStatuses: SupplierStatus[] = [
  "new",
  "ready_to_contact",
  "contacted",
  "replied",
  "shortlisted",
  "rejected",
]

export default function SuppliersPage() {
  const { currentProduct } = useAppLayout()
  const [suppliers, setSuppliers] = useState<SupplierRow[]>(initialSuppliers)
  const [statusFilter, setStatusFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [requirementFilter, setRequirementFilter] = useState("all")

  const requirementOptions = useMemo(() => {
    const all = new Set<string>()
    for (const supplier of suppliers) {
      for (const requirement of supplier.linkedRequirements) {
        all.add(requirement)
      }
    }
    return Array.from(all).sort((a, b) => a.localeCompare(b))
  }, [suppliers])

  const regionOptions = useMemo(() => {
    const all = new Set<string>()
    for (const supplier of suppliers) {
      all.add(supplier.region)
    }
    return Array.from(all).sort((a, b) => a.localeCompare(b))
  }, [suppliers])

  const activeSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.status !== "archived"),
    [suppliers]
  )

  const filteredSuppliers = useMemo(
    () =>
      activeSuppliers.filter((supplier) => {
        if (statusFilter !== "all" && supplier.status !== statusFilter) {
          return false
        }
        if (regionFilter !== "all" && supplier.region !== regionFilter) {
          return false
        }
        if (
          requirementFilter !== "all" &&
          !supplier.linkedRequirements.includes(requirementFilter)
        ) {
          return false
        }
        return true
      }),
    [activeSuppliers, requirementFilter, regionFilter, statusFilter]
  )

  function setSupplierStatus(supplierId: string, status: SupplierStatus) {
    setSuppliers((currentSuppliers) =>
      currentSuppliers.map((supplier) =>
        supplier.id === supplierId ? { ...supplier, status } : supplier
      )
    )
  }

  function setManySupplierStatus(supplierIds: string[], status: SupplierStatus) {
    const idSet = new Set(supplierIds)
    setSuppliers((currentSuppliers) =>
      currentSuppliers.map((supplier) =>
        idSet.has(supplier.id) ? { ...supplier, status } : supplier
      )
    )
  }

  const supplierColumns = useMemo<ColumnDef<SupplierRow>[]>(
    () => [
      {
        accessorKey: "supplier",
        header: "Supplier",
      },
      {
        accessorKey: "capability",
        header: "Capability",
      },
      {
        accessorKey: "region",
        header: "Region",
      },
      {
        accessorKey: "moq",
        header: "MOQ",
      },
      {
        id: "linkedRequirements",
        header: "Requirements",
        cell: ({ row }) => row.original.linkedRequirements.length,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[row.original.status]}`}
          >
            {statusLabels[row.original.status]}
          </span>
        ),
      },
      {
        accessorKey: "lastContacted",
        header: "Last Contacted",
      },
      {
        accessorKey: "fitScore",
        header: "Fit",
      },
    ],
    []
  )

  const renderRowActions = (row: SupplierRow) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">Open row actions</span>
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Supplier Actions</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <a href={row.website} target="_blank" rel="noreferrer">
              <GlobeIcon />
              Open Website
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={row.contactUrl} target="_blank" rel="noreferrer">
              <MailPlusIcon />
              Open Contact Form
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <TargetIcon />
            Set Status
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {userSettableStatuses.map((status) => (
              <DropdownMenuItem
                key={status}
                disabled={row.status === status}
                onClick={() => setSupplierStatus(row.id, status)}
              >
                {statusLabels[status]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => setSupplierStatus(row.id, "archived")}
        >
          <ArchiveIcon />
          Archive Supplier
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const renderSelectionActions = (
    selectedRows: SupplierRow[],
    clearSelection: () => void
  ) => {
    const ids = selectedRows.map((row) => row.id)

    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {selectedRows.length} selected
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <TargetIcon />
              Set Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {userSettableStatuses.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => {
                  setManySupplierStatus(ids, status)
                  clearSelection()
                }}
              >
                {statusLabels[status]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setManySupplierStatus(ids, "archived")
            clearSelection()
          }}
        >
          <ArchiveIcon />
          Archive Selected
        </Button>
        <Button variant="outline" size="sm" onClick={clearSelection}>
          Clear Selection
        </Button>
      </div>
    )
  }

  const newCount = activeSuppliers.filter((supplier) => supplier.status === "new").length
  const readyToContactCount = activeSuppliers.filter(
    (supplier) => supplier.status === "ready_to_contact"
  ).length
  const contactedCount = activeSuppliers.filter(
    (supplier) => supplier.status === "contacted"
  ).length
  const repliedCount = activeSuppliers.filter(
    (supplier) => supplier.status === "replied"
  ).length
  const shortlistedCount = activeSuppliers.filter(
    (supplier) => supplier.status === "shortlisted"
  ).length

  return (
    <div className="flex flex-1 flex-col gap-4">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {currentProduct.name}
          {currentProduct.category ? ` · ${currentProduct.category}` : ""}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">New</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{newCount}</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Ready To Contact</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {readyToContactCount}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Contacted</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {contactedCount}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Replied</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{repliedCount}</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Shortlisted</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {shortlistedCount}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold tracking-tight">
            Supplier Workspace
          </h2>
          <p className="text-sm text-muted-foreground">
            Filter suppliers, update status, and run outreach actions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 px-4 pt-4 sm:px-6">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.currentTarget.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            {userSettableStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
          <select
            value={regionFilter}
            onChange={(event) => setRegionFilter(event.currentTarget.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">All regions</option>
            {regionOptions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
          <select
            value={requirementFilter}
            onChange={(event) => setRequirementFilter(event.currentTarget.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">All requirements</option>
            {requirementOptions.map((requirement) => (
              <option key={requirement} value={requirement}>
                {requirement}
              </option>
            ))}
          </select>
        </div>
        <div className="px-4 py-4 sm:px-6">
          <DataTable
            columns={supplierColumns}
            data={filteredSuppliers}
            getRowId={(row) => row.id}
            filterColumnId="supplier"
            filterPlaceholder="Filter suppliers..."
            renderRowActions={renderRowActions}
            renderSelectionActions={renderSelectionActions}
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground shadow-sm">
        <p className="font-medium text-foreground">UI-only prototype</p>
        <p className="mt-1">
          This suppliers workspace is intentionally frontend-only and uses local
          in-memory data. No backend data has been modified.
        </p>
      </section>
    </div>
  )
}

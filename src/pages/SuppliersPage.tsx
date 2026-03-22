import type { ColumnDef } from "@tanstack/react-table"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ChevronRightIcon,
  GlobeIcon,
  MailPlusIcon,
  MoreHorizontalIcon,
  TargetIcon,
  Trash2Icon,
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
import {
  bulkUpdateSupplierMatchStatus,
  bulkDeleteSupplierMatches,
  deleteSupplierMatch,
  listSupplierMatchesForProduct,
  type RequirementMatchStatus,
  type SupplierOutreachState,
  type SupplierMatchForRequirement,
  updateSupplierMatchStatus,
} from "@/lib/suppliers"

type SupplierTableRow = {
  id: string
  rowType: "requirement" | "supplier"
  requirement: string
  supplier: string
  products: string
  region: string
  status: SupplierDisplayStatus | null
  fitScore: number | null
  linkId?: string
  website?: string | null
  contactUrl?: string | null
  subRows?: SupplierTableRow[]
}

type SupplierDisplayStatus =
  | "candidate"
  | "contact_ready"
  | "contacting"
  | "contacted"
  | "contact_failed"
  | "rejected"

const statusLabels: Record<SupplierDisplayStatus, string> = {
  candidate: "Candidate",
  contact_ready: "Contact Ready",
  contacting: "Contacting",
  contacted: "Contacted",
  contact_failed: "Contact Failed",
  rejected: "Rejected",
}

const matchStatusLabels: Record<RequirementMatchStatus, string> = {
  candidate: "Candidate",
  shortlisted: "Contact Ready",
  rejected: "Rejected",
}

const statusStyles: Record<SupplierDisplayStatus, string> = {
  candidate: "border-blue-300 bg-blue-50 text-blue-800",
  contact_ready: "border-green-400 bg-green-50 text-green-800",
  contacting: "border-amber-300 bg-amber-50 text-amber-800",
  contacted: "border-emerald-300 bg-emerald-50 text-emerald-800",
  contact_failed: "border-rose-400 bg-rose-50 text-rose-800",
  rejected: "border-rose-300 bg-rose-50 text-rose-800",
}

const statusFilterOptions: SupplierDisplayStatus[] = [
  "candidate",
  "contact_ready",
  "contacting",
  "contacted",
  "contact_failed",
  "rejected",
]

const userSettableStatuses: RequirementMatchStatus[] = [
  "candidate",
  "shortlisted",
  "rejected",
]

function toDisplayStatus(match: {
  matchStatus: RequirementMatchStatus
  outreachState: SupplierOutreachState
}): SupplierDisplayStatus {
  if (match.matchStatus === "candidate") return "candidate"
  if (match.matchStatus === "rejected") return "rejected"
  if (match.outreachState === "contacting") return "contacting"
  if (match.outreachState === "contacted") return "contacted"
  if (match.outreachState === "failed") return "contact_failed"
  return "contact_ready"
}

export default function SuppliersPage() {
  const { currentProduct } = useAppLayout()
  const [supplierMatches, setSupplierMatches] = useState<SupplierMatchForRequirement[]>(
    []
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [requirementFilter, setRequirementFilter] = useState("all")

  const loadSupplierMatches = useCallback(async () => {
    setIsLoading(true)
    const { data, error: loadError } = await listSupplierMatchesForProduct(
      currentProduct.id
    )

    if (loadError) {
      setSupplierMatches([])
      setError(loadError)
      setNotice(null)
      setIsLoading(false)
      return
    }

    setSupplierMatches(data ?? [])
    setError(null)
    setIsLoading(false)
  }, [currentProduct.id])

  useEffect(() => {
    void loadSupplierMatches()
  }, [loadSupplierMatches])

  const requirementOptions = useMemo(() => {
    const all = new Set<string>()
    for (const match of supplierMatches) {
      all.add(match.requirementTitle)
    }
    return Array.from(all).sort((left, right) => left.localeCompare(right))
  }, [supplierMatches])

  const regionOptions = useMemo(() => {
    const all = new Set<string>()
    for (const match of supplierMatches) {
      if (match.region) {
        all.add(match.region)
      }
    }
    return Array.from(all).sort((left, right) => left.localeCompare(right))
  }, [supplierMatches])

  const filteredMatches = useMemo(
    () =>
      supplierMatches.filter((match) => {
        const displayStatus = toDisplayStatus(match)
        if (statusFilter !== "all" && displayStatus !== statusFilter) {
          return false
        }
        if (regionFilter !== "all" && match.region !== regionFilter) {
          return false
        }
        if (
          requirementFilter !== "all" &&
          match.requirementTitle !== requirementFilter
        ) {
          return false
        }
        return true
      }),
    [supplierMatches, statusFilter, regionFilter, requirementFilter]
  )

  const groupedRequirementRows = useMemo<SupplierTableRow[]>(() => {
    const byRequirement = new Map<string, SupplierMatchForRequirement[]>()

    for (const match of filteredMatches) {
      const current = byRequirement.get(match.requirementTitle)
      if (current) {
        current.push(match)
        continue
      }
      byRequirement.set(match.requirementTitle, [match])
    }

    return Array.from(byRequirement.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([requirement, matches]) => {
        const subRows = [...matches]
          .sort((left, right) => {
            const leftFit = left.fitScore ?? -1
            const rightFit = right.fitScore ?? -1
            if (rightFit !== leftFit) {
              return rightFit - leftFit
            }
            return left.supplierName.localeCompare(right.supplierName)
          })
          .map((match) => ({
            id: `link:${match.linkId}`,
            rowType: "supplier" as const,
            requirement,
            supplier: match.supplierName,
            products: match.products.length ? match.products.join(", ") : "—",
            region: match.region ?? "Unknown",
            status: toDisplayStatus(match),
            fitScore: match.fitScore,
            linkId: match.linkId,
            website: match.website,
            contactUrl: match.contactUrl,
          }))

        return {
          id: `requirement:${requirement}`,
          rowType: "requirement" as const,
          requirement,
          supplier: `${subRows.length} supplier${subRows.length === 1 ? "" : "s"}`,
          products: "—",
          region: "—",
          status: null,
          fitScore: null,
          subRows,
        }
      })
  }, [filteredMatches])

  const supplierColumns = useMemo<ColumnDef<SupplierTableRow>[]>(
    () => [
      {
        id: "item",
        accessorFn: (row) =>
          row.rowType === "requirement"
            ? row.requirement
            : `${row.supplier} ${row.requirement}`,
        header: "Requirement / Supplier",
        cell: ({ row }) => {
          if (row.original.rowType === "requirement") {
            return (
              <button
                type="button"
                onClick={row.getToggleExpandedHandler()}
                className="inline-flex items-center gap-2 font-medium"
              >
                <ChevronRightIcon
                  className={`h-4 w-4 shrink-0 transition-transform ${row.getIsExpanded() ? "rotate-90" : ""}`}
                />
                <span>{row.original.requirement}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  ({row.subRows.length})
                </span>
              </button>
            )
          }

          return <span className="block pl-8 font-medium">{row.original.supplier}</span>
        },
      },
      {
        accessorKey: "products",
        header: "Products",
        cell: ({ row }) =>
          row.original.rowType === "supplier" ? (
            <p className="max-w-[360px] whitespace-normal leading-6">
              {row.original.products}
            </p>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "region",
        header: "Region",
        cell: ({ row }) =>
          row.original.rowType === "supplier" ? (
            row.original.region
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "status",
        header: "Match Status",
        cell: ({ row }) =>
          row.original.rowType === "supplier" && row.original.status ? (
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[row.original.status]}`}
            >
              {statusLabels[row.original.status]}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "fitScore",
        header: "Fit",
        cell: ({ row }) =>
          row.original.rowType === "supplier" && row.original.fitScore !== null ? (
            `${Math.round(row.original.fitScore)}%`
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ],
    []
  )

  const handleSetStatus = useCallback(
    async (linkId: string, status: RequirementMatchStatus) => {
      setIsActionLoading(true)
      setError(null)
      setNotice(null)

      const { error: updateError } = await updateSupplierMatchStatus(linkId, status)
      if (updateError) {
        setError(updateError)
        setIsActionLoading(false)
        return
      }

      await loadSupplierMatches()
      setIsActionLoading(false)
    },
    [loadSupplierMatches]
  )

  const handleBulkSetStatus = useCallback(
    async (
      linkIds: string[],
      status: RequirementMatchStatus,
      clearSelection: () => void
    ) => {
      if (!linkIds.length) {
        return
      }

      setIsActionLoading(true)
      setError(null)
      setNotice(null)

      const { error: updateError } = await bulkUpdateSupplierMatchStatus(
        linkIds,
        status
      )
      if (updateError) {
        setError(updateError)
        setIsActionLoading(false)
        return
      }

      clearSelection()
      await loadSupplierMatches()
      setIsActionLoading(false)
    },
    [loadSupplierMatches]
  )

  const handleContactSuppliers = useCallback(
    async (linkIds: string[], requirementTitle: string) => {
      if (!linkIds.length) {
        return
      }

      setIsActionLoading(true)
      setError(null)
      setNotice(null)

      const { error: statusError } = await bulkUpdateSupplierMatchStatus(
        linkIds,
        "shortlisted"
      )
      if (statusError) {
        setError(statusError)
        setIsActionLoading(false)
        return
      }

      setNotice(
        `"${requirementTitle}" queued for contact. Cron worker will pick one supplier at a time.`
      )
      await loadSupplierMatches()
      setIsActionLoading(false)
    },
    [loadSupplierMatches]
  )

  const handleDeleteRows = useCallback(
    async (linkIds: string[], onSuccess?: () => void) => {
      if (!linkIds.length) {
        return
      }

      setIsActionLoading(true)
      setError(null)
      setNotice(null)

      const { error: deleteError } = await bulkDeleteSupplierMatches(linkIds)
      if (deleteError) {
        setError(deleteError)
        setIsActionLoading(false)
        return
      }

      onSuccess?.()
      setNotice(`Deleted ${linkIds.length} row${linkIds.length === 1 ? "" : "s"}.`)
      await loadSupplierMatches()
      setIsActionLoading(false)
    },
    [loadSupplierMatches]
  )

  const renderRowActions = (row: SupplierTableRow) => {
    if (row.rowType === "requirement") {
      const requirementLinkIds = Array.from(
        new Set(
          (row.subRows ?? [])
            .map((subRow) => subRow.linkId)
            .filter((linkId): linkId is string => Boolean(linkId))
        )
      )

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={isActionLoading || requirementLinkIds.length === 0}
            >
              <span className="sr-only">Open requirement actions</span>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Requirement Actions</DropdownMenuLabel>
            <DropdownMenuItem
              disabled={isActionLoading || requirementLinkIds.length === 0}
              onSelect={() =>
                void handleContactSuppliers(
                  requirementLinkIds,
                  row.requirement
                )
              }
            >
              <MailPlusIcon />
              Contact Suppliers
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={isActionLoading || requirementLinkIds.length === 0}
              onSelect={() => void handleDeleteRows(requirementLinkIds)}
            >
              <Trash2Icon />
              Delete Rows
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    if (!row.linkId || !row.status) {
      return null
    }

    const linkId = row.linkId

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={isActionLoading}
          >
            <span className="sr-only">Open row actions</span>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Supplier Actions</DropdownMenuLabel>
          <DropdownMenuGroup>
            {row.website ? (
              <DropdownMenuItem asChild>
                <a href={row.website} target="_blank" rel="noreferrer">
                  <GlobeIcon />
                  Open Website
                </a>
              </DropdownMenuItem>
            ) : null}
            {row.contactUrl ? (
              <DropdownMenuItem asChild>
                <a href={row.contactUrl} target="_blank" rel="noreferrer">
                  <MailPlusIcon />
                  Open Contact Form
                </a>
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <TargetIcon />
              Set Match Status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {userSettableStatuses.map((status) => (
                <DropdownMenuItem
                  key={status}
                  disabled={isActionLoading || row.status === status}
                  onSelect={() => void handleSetStatus(linkId, status)}
                >
                  {matchStatusLabels[status]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={isActionLoading}
            onClick={async () => {
              setIsActionLoading(true)
              setError(null)
              setNotice(null)

              const { error: deleteError } = await deleteSupplierMatch(linkId)
              if (deleteError) {
                setError(deleteError)
                setIsActionLoading(false)
                return
              }

              setNotice("Deleted 1 row.")
              await loadSupplierMatches()
              setIsActionLoading(false)
            }}
          >
            <Trash2Icon />
            Delete Row
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const renderSelectionActions = (
    selectedRows: SupplierTableRow[],
    clearSelection: () => void
  ) => {
    const actionableRows = selectedRows.filter(
      (row): row is SupplierTableRow & { linkId: string } =>
        row.rowType === "supplier" && Boolean(row.linkId)
    )

    const linkIds = Array.from(
      new Set(
        actionableRows
          .map((row) => row.linkId)
          .filter((linkId): linkId is string => Boolean(linkId))
      )
    )

    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{linkIds.length} selected</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isActionLoading}>
              <TargetIcon />
              Set Match Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {userSettableStatuses.map((status) => (
              <DropdownMenuItem
                key={status}
                disabled={isActionLoading || linkIds.length === 0}
                onSelect={() =>
                  void handleBulkSetStatus(linkIds, status, clearSelection)
                }
              >
                {matchStatusLabels[status]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="sm"
          onClick={clearSelection}
          disabled={isActionLoading}
        >
          Clear Selection
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isActionLoading || linkIds.length === 0}
          onClick={() => void handleDeleteRows(linkIds, clearSelection)}
        >
          <Trash2Icon />
          Delete Selected
        </Button>
      </div>
    )
  }

  const candidateCount = supplierMatches.filter((match) => {
    return toDisplayStatus(match) === "candidate"
  }).length
  const readyToContactCount = supplierMatches.filter((match) => {
    return toDisplayStatus(match) === "contact_ready"
  }).length
  const rejectedCount = supplierMatches.filter(
    (match) => toDisplayStatus(match) === "rejected"
  ).length
  const requirementsWithMatches = new Set(
    supplierMatches.map((match) => match.requirementId)
  ).size
  const uniqueSuppliersCount = new Set(
    supplierMatches.map((match) => match.supplierId)
  ).size

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
          <p className="text-sm text-muted-foreground">Candidates</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {isLoading ? "..." : candidateCount}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Contact Ready</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {isLoading ? "..." : readyToContactCount}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Rejected</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {isLoading ? "..." : rejectedCount}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Requirements With Matches</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {isLoading ? "..." : requirementsWithMatches}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Unique Suppliers</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {isLoading ? "..." : uniqueSuppliersCount}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold tracking-tight">
            Supplier Workspace
          </h2>
          <p className="text-sm text-muted-foreground">
            Grouped by requirement, loaded live from your Supabase data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 px-4 pt-4 sm:px-6">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.currentTarget.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            {statusFilterOptions.map((status) => (
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
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading suppliers...</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <>
              {notice ? (
                <p className="mb-3 text-sm text-emerald-700">{notice}</p>
              ) : null}
              <DataTable
                columns={supplierColumns}
                data={groupedRequirementRows}
                getRowId={(row) => row.id}
                getSubRows={(row) => row.subRows}
                defaultExpandAllRows
                filterColumnId="item"
                filterPlaceholder="Filter requirements or suppliers..."
                renderRowActions={renderRowActions}
                renderSelectionActions={renderSelectionActions}
                enableRowSelection={(row) => row.rowType === "supplier"}
                getRowClassName={(row) =>
                  row.rowType === "requirement"
                    ? "bg-muted/70 hover:bg-muted/80"
                    : undefined
                }
              />
            </>
          )}
        </div>
      </section>
    </div>
  )
}

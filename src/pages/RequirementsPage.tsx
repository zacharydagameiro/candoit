import type { ColumnDef } from "@tanstack/react-table"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArchiveIcon,
  CircleCheckBigIcon,
  ExternalLinkIcon,
  LoaderCircleIcon,
  MoreHorizontalIcon,
  PlayCircleIcon,
  RefreshCwIcon,
  RotateCcwIcon,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useAppLayout } from "@/hooks/use-app-layout"
import {
  archiveRequirement,
  bulkDeleteRequirements,
  bulkArchiveRequirements,
  bulkUpdateRequirementStatus,
  deleteRequirement,
  listSuppliersForRequirement,
  listRequirementsForProduct,
  type RequirementSupplierSummary,
  updateRequirementStatus,
  type RequirementWithFoundCount,
  type UserSettableRequirementStatus,
} from "@/lib/requirements"

type RequirementStatusLabel = "Waiting" | "Ready To Search" | "Finding" | "Done"
type RequirementRowRawStatus = "ready" | "queued" | "finding" | "found"

type RequirementRow = {
  id: string
  requirement: string
  category: string
  currentDefinition: string
  status: RequirementStatusLabel
  rawStatus: RequirementRowRawStatus
  amountFound: number
}

const statusStyles: Record<RequirementStatusLabel, string> = {
  Waiting: "border-blue-300 bg-blue-50 text-blue-800",
  "Ready To Search": "border-violet-300 bg-violet-50 text-violet-800",
  Finding: "border-amber-300 bg-amber-50 text-amber-800",
  Done: "border-emerald-300 bg-emerald-50 text-emerald-800",
}

function mapRequirementStatus(
  status: RequirementWithFoundCount["status"]
): RequirementStatusLabel {
  if (status === "ready") return "Waiting"
  if (status === "queued") return "Ready To Search"
  if (status === "finding") return "Finding"
  return "Done"
}

function mapRequirementRawStatus(
  status: RequirementWithFoundCount["status"]
): RequirementRowRawStatus {
  if (status === "ready") return "ready"
  if (status === "queued") return "queued"
  if (status === "finding") return "finding"
  return "found"
}

function isUserMutableStatus(status: RequirementRowRawStatus) {
  return status === "ready" || status === "queued"
}

export default function RequirementsPage() {
  const { currentProduct } = useAppLayout()
  const [rows, setRows] = useState<RequirementRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(
    null
  )
  const [detailSuppliers, setDetailSuppliers] = useState<RequirementSupplierSummary[]>(
    []
  )
  const [isDetailSuppliersLoading, setIsDetailSuppliersLoading] = useState(false)
  const [detailSuppliersError, setDetailSuppliersError] = useState<string | null>(
    null
  )

  const loadRequirements = useCallback(async () => {
    setIsLoading(true)
    const { data, error: loadError } = await listRequirementsForProduct(
      currentProduct.id
    )

    if (loadError) {
      setRows([])
      setError(loadError)
      setIsLoading(false)
      return
    }

    const mappedRows =
      data?.map((requirement) => ({
        id: requirement.id,
        requirement: requirement.title,
        category: requirement.category ?? "Uncategorized",
        currentDefinition: requirement.description ?? "",
        status: mapRequirementStatus(requirement.status),
        rawStatus: mapRequirementRawStatus(requirement.status),
        amountFound: requirement.amountFound,
      })) ?? []

    setRows(mappedRows)
    setSelectedRequirementId((currentId) =>
      currentId && mappedRows.some((row) => row.id === currentId) ? currentId : null
    )
    setError(null)
    setIsLoading(false)
  }, [currentProduct.id])

  useEffect(() => {
    void loadRequirements()
  }, [loadRequirements])

  async function handleSetStatus(
    requirementId: string,
    status: UserSettableRequirementStatus
  ) {
    setIsActionLoading(true)
    setError(null)
    const { error: statusError } = await updateRequirementStatus(requirementId, status)
    if (statusError) {
      setError(statusError)
      setIsActionLoading(false)
      return
    }

    await loadRequirements()
    setIsActionLoading(false)
  }

  async function handleArchiveRequirement(requirementId: string) {
    setIsActionLoading(true)
    setError(null)
    const { error: archiveError } = await archiveRequirement(requirementId)
    if (archiveError) {
      setError(archiveError)
      setIsActionLoading(false)
      return
    }

    await loadRequirements()
    setIsActionLoading(false)
  }

  async function handleBulkSetStatus(
    requirementIds: string[],
    status: UserSettableRequirementStatus,
    clearSelection: () => void
  ) {
    setIsActionLoading(true)
    setError(null)
    const { error: statusError } = await bulkUpdateRequirementStatus(
      requirementIds,
      status
    )
    if (statusError) {
      setError(statusError)
      setIsActionLoading(false)
      return
    }

    clearSelection()
    await loadRequirements()
    setIsActionLoading(false)
  }

  async function handleBulkArchive(
    requirementIds: string[],
    clearSelection: () => void
  ) {
    setIsActionLoading(true)
    setError(null)
    const { error: archiveError } = await bulkArchiveRequirements(requirementIds)
    if (archiveError) {
      setError(archiveError)
      setIsActionLoading(false)
      return
    }

    clearSelection()
    await loadRequirements()
    setIsActionLoading(false)
  }

  async function handleDeleteRequirement(requirementId: string) {
    setIsActionLoading(true)
    setError(null)
    const { error: deleteError } = await deleteRequirement(requirementId)
    if (deleteError) {
      setError(deleteError)
      setIsActionLoading(false)
      return
    }

    await loadRequirements()
    setIsActionLoading(false)
  }

  async function handleBulkDelete(
    requirementIds: string[],
    clearSelection: () => void
  ) {
    setIsActionLoading(true)
    setError(null)
    const { error: deleteError } = await bulkDeleteRequirements(requirementIds)
    if (deleteError) {
      setError(deleteError)
      setIsActionLoading(false)
      return
    }

    clearSelection()
    await loadRequirements()
    setIsActionLoading(false)
  }

  const requirementColumns = useMemo<ColumnDef<RequirementRow>[]>(
    () => [
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
            {row.original.currentDefinition || "No description yet."}
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
      {
        accessorKey: "amountFound",
        header: "Amount Found",
      },
    ],
    []
  )

  const queueRows = useMemo(
    () => rows.filter((row) => row.rawStatus === "ready" || row.rawStatus === "queued"),
    [rows]
  )

  const activeRows = useMemo(
    () => rows.filter((row) => row.rawStatus === "finding" || row.rawStatus === "found"),
    [rows]
  )

  const waitingCount = useMemo(
    () => rows.filter((row) => row.rawStatus === "ready").length,
    [rows]
  )
  const readyToSearchCount = useMemo(
    () => rows.filter((row) => row.rawStatus === "queued").length,
    [rows]
  )
  const findingCount = useMemo(
    () => rows.filter((row) => row.rawStatus === "finding").length,
    [rows]
  )
  const doneCount = useMemo(
    () => rows.filter((row) => row.rawStatus === "found").length,
    [rows]
  )
  const foundSuppliersTotal = useMemo(
    () => rows.reduce((total, row) => total + row.amountFound, 0),
    [rows]
  )
  const selectedRequirement = useMemo(
    () => rows.find((row) => row.id === selectedRequirementId) ?? null,
    [rows, selectedRequirementId]
  )

  useEffect(() => {
    if (!selectedRequirementId) {
      setDetailSuppliers([])
      setDetailSuppliersError(null)
      setIsDetailSuppliersLoading(false)
      return
    }

    let isCancelled = false
    setIsDetailSuppliersLoading(true)
    setDetailSuppliersError(null)

    void listSuppliersForRequirement(selectedRequirementId).then(({ data, error }) => {
      if (isCancelled) return
      if (error) {
        setDetailSuppliers([])
        setDetailSuppliersError(error)
      } else {
        setDetailSuppliers(data ?? [])
      }
      setIsDetailSuppliersLoading(false)
    })

    return () => {
      isCancelled = true
    }
  }, [selectedRequirementId, rows])

  const renderRowActions = useCallback(
    (row: RequirementRow) => {
      const isMutable = isUserMutableStatus(row.rawStatus)

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open row actions</span>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Requirement Actions</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <TargetIcon />
                  Supplier Search State
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    disabled={isActionLoading || !isMutable || row.rawStatus === "ready"}
                    onClick={() => void handleSetStatus(row.id, "ready")}
                  >
                    <RotateCcwIcon />
                    Set Waiting
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={isActionLoading || !isMutable || row.rawStatus === "queued"}
                    onClick={() => void handleSetStatus(row.id, "queued")}
                  >
                    <PlayCircleIcon />
                    Ready To Search
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <LoaderCircleIcon />
                    Finding (Agent)
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <CircleCheckBigIcon />
                    Done (Agent)
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={isActionLoading || !isMutable}
              onClick={() => void handleArchiveRequirement(row.id)}
            >
              <ArchiveIcon />
              Archive Requirement
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={isActionLoading}
              onClick={() => void handleDeleteRequirement(row.id)}
            >
              <Trash2Icon />
              Delete Requirement
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    [isActionLoading]
  )

  const renderSelectionActions = useCallback(
    (selectedRows: RequirementRow[], clearSelection: () => void) => {
      const mutableSelectedRows = selectedRows.filter((row) =>
        isUserMutableStatus(row.rawStatus)
      )
      const selectedIds = mutableSelectedRows.map((row) => row.id)
      const hasAnyMutable = selectedIds.length > 0

      return (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedRows.length} selected
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isActionLoading || !hasAnyMutable}
              >
                <TargetIcon />
                Search State
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                disabled={isActionLoading}
                onClick={() => void handleBulkSetStatus(selectedIds, "ready", clearSelection)}
              >
                <RotateCcwIcon />
                Set Waiting
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isActionLoading}
                onClick={() =>
                  void handleBulkSetStatus(selectedIds, "queued", clearSelection)
                }
              >
                <PlayCircleIcon />
                Ready To Search
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            disabled={isActionLoading || !hasAnyMutable}
            onClick={() => void handleBulkArchive(selectedIds, clearSelection)}
          >
            <ArchiveIcon />
            Archive Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isActionLoading}
            onClick={clearSelection}
          >
            Clear Selection
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isActionLoading || selectedRows.length === 0}
            onClick={() =>
              void handleBulkDelete(
                selectedRows.map((row) => row.id),
                clearSelection
              )
            }
          >
            <Trash2Icon />
            Delete Selected
          </Button>
        </div>
      )
    },
    [isActionLoading]
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          Product Requirements
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{currentProduct.name}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Waiting</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {isLoading ? "..." : waitingCount}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Ready To Search</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {isLoading ? "..." : readyToSearchCount}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Finding</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {isLoading ? "..." : findingCount}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Done</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {isLoading ? "..." : doneCount}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Suppliers Found</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {isLoading ? "..." : foundSuppliersTotal}
          </p>
        </div>
      </section>

      <section>
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Queue
              </h2>
              <p className="text-sm text-muted-foreground">
                Requirements waiting to start supplier search.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading || isActionLoading}
              onClick={() => void loadRequirements()}
            >
              <RefreshCwIcon />
              Refresh
            </Button>
          </div>
          <div className="px-4 py-4 sm:px-6">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading requirements...
              </p>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <DataTable
                columns={requirementColumns}
                data={queueRows}
                getRowId={(row) => row.id}
                filterColumnId="requirement"
                filterPlaceholder="Filter queue..."
                renderRowActions={renderRowActions}
                renderSelectionActions={renderSelectionActions}
                onRowClick={(row) => setSelectedRequirementId(row.id)}
                getRowClassName={() => "cursor-pointer"}
              />
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Supplier Search Progress
              </h2>
              <p className="text-sm text-muted-foreground">
                Requirements currently being worked on by the agent, or completed.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading || isActionLoading}
              onClick={() => void loadRequirements()}
            >
              <RefreshCwIcon />
              Refresh
            </Button>
          </div>
          <div className="px-4 py-4 sm:px-6">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading requirements...
              </p>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <DataTable
                columns={requirementColumns}
                data={activeRows}
                getRowId={(row) => row.id}
                filterColumnId="requirement"
                filterPlaceholder="Filter active work..."
                renderRowActions={renderRowActions}
                enableRowSelection={false}
                onRowClick={(row) => setSelectedRequirementId(row.id)}
                getRowClassName={() => "cursor-pointer"}
              />
            )}
          </div>
        </div>
      </section>

      <Sheet
        open={Boolean(selectedRequirement)}
        onOpenChange={(open) => {
          if (!open) setSelectedRequirementId(null)
        }}
      >
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-2xl">
          {selectedRequirement ? (
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b px-6 py-5">
                <SheetTitle className="text-xl">
                  {selectedRequirement.requirement}
                </SheetTitle>
                <SheetDescription>{currentProduct.name}</SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                <div className="grid gap-4 rounded-xl border bg-muted/30 p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Status
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[selectedRequirement.status]}`}
                    >
                      {selectedRequirement.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Category
                    </p>
                    <p className="mt-2 text-sm">{selectedRequirement.category}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Suppliers Found
                    </p>
                    <p className="mt-2 text-sm font-medium">
                      {selectedRequirement.amountFound}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Current Definition
                  </p>
                  <div className="mt-2 rounded-xl border bg-card p-4">
                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {selectedRequirement.currentDefinition || "No description yet."}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Supplier Search State
                    </p>
                  </div>
                  <div className="rounded-xl border bg-card p-4">
                    {selectedRequirement.rawStatus === "ready" ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          disabled={isActionLoading}
                          onClick={() =>
                            void handleSetStatus(selectedRequirement.id, "queued")
                          }
                        >
                          <PlayCircleIcon />
                          Ready To Search
                        </Button>
                      </div>
                    ) : null}
                    {selectedRequirement.rawStatus === "queued" ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isActionLoading}
                          onClick={() =>
                            void handleSetStatus(selectedRequirement.id, "ready")
                          }
                        >
                          <RotateCcwIcon />
                          Set Waiting
                        </Button>
                      </div>
                    ) : null}
                    {selectedRequirement.rawStatus === "finding" ||
                    selectedRequirement.rawStatus === "found" ? (
                      <p className="text-sm text-muted-foreground">
                        This requirement is controlled by the agent while in progress
                        or after completion.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Matched Suppliers
                  </p>
                  <div className="mt-2 rounded-xl border bg-card p-4">
                    {isDetailSuppliersLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Loading suppliers...
                      </p>
                    ) : detailSuppliersError ? (
                      <p className="text-sm text-destructive">{detailSuppliersError}</p>
                    ) : detailSuppliers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No suppliers linked to this requirement yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {detailSuppliers.map((supplier) => (
                          <div
                            key={supplier.linkId}
                            className="rounded-lg border bg-background p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium">
                                  {supplier.supplierName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {supplier.region ?? "Unknown region"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Fit</p>
                                <p className="text-sm font-medium">
                                  {supplier.fitScore !== null
                                    ? `${Math.round(supplier.fitScore)}%`
                                    : "—"}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="rounded-full border bg-blue-50 px-2 py-0.5 text-xs text-blue-800">
                                {supplier.matchStatus}
                              </span>
                              <span className="rounded-full border bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                                outreach: {supplier.outreachState}
                              </span>
                            </div>
                            {(supplier.website || supplier.contactUrl) && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {supplier.website ? (
                                  <a
                                    href={supplier.website}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <Button variant="outline" size="sm">
                                      Website
                                      <ExternalLinkIcon />
                                    </Button>
                                  </a>
                                ) : null}
                                {supplier.contactUrl ? (
                                  <a
                                    href={supplier.contactUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <Button variant="outline" size="sm">
                                      Contact
                                      <ExternalLinkIcon />
                                    </Button>
                                  </a>
                                ) : null}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t bg-background px-6 py-4">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRequirementId(null)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isActionLoading || !isUserMutableStatus(selectedRequirement.rawStatus)}
                    onClick={() => void handleArchiveRequirement(selectedRequirement.id)}
                  >
                    <ArchiveIcon />
                    Archive
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={isActionLoading}
                    onClick={() => void handleDeleteRequirement(selectedRequirement.id)}
                  >
                    <Trash2Icon />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

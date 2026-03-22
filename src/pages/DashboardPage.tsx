import { useEffect, useMemo, useState } from "react"
import {
  ArrowUpRightIcon,
  CheckCircle2Icon,
  Clock3Icon,
  LoaderCircleIcon,
  MessageSquareMoreIcon,
  SearchCheckIcon,
} from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useAppLayout } from "@/hooks/use-app-layout"
import { listDiscoveryThreadsForProduct } from "@/lib/discovery-chat"
import {
  listRequirementsForProduct,
  type RequirementWithFoundCount,
} from "@/lib/requirements"

type DashboardRequirementRow = {
  id: string
  title: string
  category: string | null
  status: "ready" | "queued" | "finding" | "found"
  amountFound: number
}

type DashboardThreadRow = {
  id: string
  title: string
  updated_at: string
}

type ActiveRequirementWithFoundCount = RequirementWithFoundCount & {
  status: DashboardRequirementRow["status"]
}

function isActiveRequirement(
  requirement: RequirementWithFoundCount
): requirement is ActiveRequirementWithFoundCount {
  return requirement.status !== "archived"
}

function formatDate(dateValue: string) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) {
    return "Unknown time"
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export default function DashboardPage() {
  const { currentProduct } = useAppLayout()
  const [requirements, setRequirements] = useState<DashboardRequirementRow[]>([])
  const [threads, setThreads] = useState<DashboardThreadRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadDashboardData() {
      setIsLoading(true)

      const [requirementsResult, threadsResult] = await Promise.all([
        listRequirementsForProduct(currentProduct.id),
        listDiscoveryThreadsForProduct(currentProduct.id),
      ])

      if (!isMounted) {
        return
      }

      if (requirementsResult.error) {
        setError(requirementsResult.error)
        setIsLoading(false)
        return
      }

      if (threadsResult.error) {
        setError(threadsResult.error)
        setIsLoading(false)
        return
      }

      const nextRequirements =
        requirementsResult.data
          ?.filter(isActiveRequirement)
          .map((requirement) => ({
            id: requirement.id,
            title: requirement.title,
            category: requirement.category,
            status: requirement.status,
            amountFound: requirement.amountFound,
          })) ?? []

      const nextThreads =
        threadsResult.data?.slice(0, 6).map((thread) => ({
          id: thread.id,
          title: thread.title,
          updated_at: thread.updated_at,
        })) ?? []

      setRequirements(nextRequirements)
      setThreads(nextThreads)
      setError(null)
      setIsLoading(false)
    }

    void loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [currentProduct.id])

  const queueRequirements = useMemo(
    () =>
      requirements.filter(
        (requirement) =>
          requirement.status === "ready" || requirement.status === "queued"
      ),
    [requirements]
  )

  const queueCount = queueRequirements.length
  const inProgressCount = requirements.filter(
    (requirement) => requirement.status === "finding"
  ).length
  const doneCount = requirements.filter(
    (requirement) => requirement.status === "found"
  ).length
  const shortlistedTotal = requirements.reduce(
    (total, requirement) => total + requirement.amountFound,
    0
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {currentProduct.name}
          {currentProduct.category ? ` · ${currentProduct.category}` : ""}
        </p>
      </section>

      {error ? (
        <section className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Queue</p>
            <Clock3Icon className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {isLoading ? "..." : queueCount}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Waiting or ready-to-search requirements.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <LoaderCircleIcon className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {isLoading ? "..." : inProgressCount}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Requirements currently being matched.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Done</p>
            <CheckCircle2Icon className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {isLoading ? "..." : doneCount}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Requirements completed by the agent.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Suppliers Shortlisted</p>
            <SearchCheckIcon className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {isLoading ? "..." : shortlistedTotal}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Shortlisted supplier links across requirements.
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Action Queue</h2>
              <p className="text-sm text-muted-foreground">
                Requirements waiting for supplier search to begin.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/requirements">
                Open Requirements
                <ArrowUpRightIcon />
              </Link>
            </Button>
          </div>
          <div className="divide-y">
            {isLoading ? (
              <div className="px-6 py-5 text-sm text-muted-foreground">
                Loading queue...
              </div>
            ) : queueRequirements.length ? (
              queueRequirements.slice(0, 8).map((requirement) => (
                <div
                  key={requirement.id}
                  className="flex flex-col gap-2 px-6 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">{requirement.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {requirement.category ?? "Uncategorized"}
                    </p>
                  </div>
                  <span className="inline-flex w-fit rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {requirement.status === "queued"
                      ? "Ready To Search"
                      : "Waiting"}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-6 py-5 text-sm text-muted-foreground">
                No queued requirements yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Recent Conversations
              </h2>
              <p className="text-sm text-muted-foreground">
                Latest discovery threads for this product.
              </p>
            </div>
            <MessageSquareMoreIcon className="size-4 text-muted-foreground" />
          </div>
          <div className="divide-y">
            {isLoading ? (
              <div className="px-6 py-5 text-sm text-muted-foreground">
                Loading conversations...
              </div>
            ) : threads.length ? (
              threads.map((thread) => (
                <div
                  key={thread.id}
                  className="flex items-start justify-between gap-3 px-6 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{thread.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Updated {formatDate(thread.updated_at)}
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/chats/discovery">Open</Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="px-6 py-5 text-sm text-muted-foreground">
                No conversation threads yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

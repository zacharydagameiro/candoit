import { Button } from "@/components/ui/button"
import { useAppLayout } from "@/hooks/use-app-layout"

type ChatStage = "discovery" | "outreach" | "negotiation"

type ChatStageConfig = {
  title: string
  description: string
  actionLabel: string
  stats: {
    label: string
    value: string
  }[]
  threads: {
    title: string
    preview: string
    status: string
  }[]
}

const chatStageContent: Record<ChatStage, ChatStageConfig> = {
  discovery: {
    title: "Discovery Chats",
    description:
      "Use chat threads to refine product goals, sourcing assumptions, and supplier search criteria.",
    actionLabel: "Start Discovery Thread",
    stats: [
      { label: "Open Threads", value: "3" },
      { label: "Briefs Drafted", value: "2" },
      { label: "Questions Pending", value: "5" },
    ],
    threads: [
      {
        title: "Launch Product Brief",
        preview: "Clarify packaging format, flavor direction, and target retail positioning.",
        status: "Active",
      },
      {
        title: "Supplier Search Criteria",
        preview: "Define region, MOQ, manufacturing capabilities, and compliance filters.",
        status: "Draft",
      },
      {
        title: "Ingredient Constraints",
        preview: "Review caffeine level, sweetener strategy, and electrolytes.",
        status: "Waiting",
      },
    ],
  },
  outreach: {
    title: "Outreach Chats",
    description:
      "Track the conversational lane used to prepare and review supplier outreach messaging.",
    actionLabel: "Draft Outreach Prompt",
    stats: [
      { label: "Drafts Ready", value: "4" },
      { label: "Supplier Threads", value: "6" },
      { label: "Pending Review", value: "2" },
    ],
    threads: [
      {
        title: "Northline Beverages Intro",
        preview: "RFQ message covering formulation, MOQ, and sample timing.",
        status: "Ready",
      },
      {
        title: "PureForm Labs Follow-up",
        preview: "Ask for flavor development process and pilot batch options.",
        status: "Needs Review",
      },
      {
        title: "Polar Pack Studio Contact Form",
        preview: "Condense outreach copy for short-form form submission.",
        status: "Queued",
      },
    ],
  },
  negotiation: {
    title: "Negotiation Chats",
    description:
      "Placeholder lane for comparing quotes, pushing on MOQ, and managing supplier follow-up.",
    actionLabel: "Open Comparison Thread",
    stats: [
      { label: "Negotiations Open", value: "2" },
      { label: "Quotes Compared", value: "1" },
      { label: "Leverage Points", value: "4" },
    ],
    threads: [
      {
        title: "MOQ Pushback Strategy",
        preview: "Prepare a lower-volume ask using competing supplier benchmarks.",
        status: "Active",
      },
      {
        title: "Packaging Cost Comparison",
        preview: "Compare label and bottle pricing between shortlisted vendors.",
        status: "In Review",
      },
      {
        title: "Lead Time Challenge",
        preview: "Frame negotiation points around launch timing and pilot run urgency.",
        status: "Draft",
      },
    ],
  },
}

type ChatsStagePageProps = {
  stage: ChatStage
}

export default function ChatsStagePage({ stage }: ChatsStagePageProps) {
  const { currentProduct } = useAppLayout()
  const config = chatStageContent[stage]

  return (
    <div className="flex flex-1 flex-col gap-4">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {currentProduct.name} conversation workflow
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

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold tracking-tight">
            Chat Threads
          </h2>
          <p className="text-sm text-muted-foreground">
            Static placeholder conversations for this workflow lane.
          </p>
        </div>

        <div className="divide-y">
          {config.threads.map((thread) => (
            <div
              key={thread.title}
              className="flex flex-col gap-3 px-6 py-5 md:flex-row md:items-start md:justify-between"
            >
              <div className="max-w-2xl">
                <p className="font-medium">{thread.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {thread.preview}
                </p>
              </div>
              <div className="w-fit rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {thread.status}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

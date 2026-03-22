import { useAppLayout } from "@/hooks/use-app-layout"

type ChatStage = "discovery" | "outreach" | "negotiation"

const chatStageTitles: Record<ChatStage, string> = {
  discovery: "Discovery Chats",
  outreach: "Outreach Chats",
  negotiation: "Negotiation Chats",
}

type ChatsStagePageProps = {
  stage: ChatStage
}

export default function ChatsStagePage({ stage }: ChatsStagePageProps) {
  const { currentProduct } = useAppLayout()
  const stageTitle = chatStageTitles[stage]

  return (
    <div className="flex flex-1 flex-col gap-4">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">{stageTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {currentProduct.name}
        </p>
      </section>
    </div>
  )
}

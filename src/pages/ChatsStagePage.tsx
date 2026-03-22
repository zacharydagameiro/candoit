import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppLayout } from "@/hooks/use-app-layout"
import {
  createDiscoveryThread,
  discardRequirementCandidate,
  listDiscoveryMessagesForThread,
  listDiscoveryThreadsForProduct,
  listRequirementCandidatesForThread,
  streamDiscoveryChat,
  type DiscoveryMessageRecord,
  type DiscoveryThreadRecord,
  type RequirementCandidateRecord,
} from "@/lib/discovery-chat"
import {
  promoteRequirementCandidate,
  unpromoteRequirementCandidate,
} from "@/lib/requirements"

type ChatStage = "discovery" | "outreach" | "negotiation"

const chatStageTitles: Record<ChatStage, string> = {
  discovery: "Discovery Chats",
  outreach: "Outreach Chats",
  negotiation: "Negotiation Chats",
}

type ChatsStagePageProps = {
  stage: ChatStage
}

type LocalChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
}

export default function ChatsStagePage({ stage }: ChatsStagePageProps) {
  const { currentProduct } = useAppLayout()
  const stageTitle = chatStageTitles[stage]
  const [threads, setThreads] = useState<DiscoveryThreadRecord[]>([])
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<LocalChatMessage[]>([])
  const [candidates, setCandidates] = useState<RequirementCandidateRecord[]>([])
  const [draftMessage, setDraftMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDiscoveryStage = stage === "discovery"

  useEffect(() => {
    if (!isDiscoveryStage) {
      return
    }

    let isMounted = true

    async function loadThreads() {
      setIsLoading(true)
      const { data, error: loadError } = await listDiscoveryThreadsForProduct(
        currentProduct.id
      )

      if (!isMounted) {
        return
      }

      if (loadError) {
        setThreads([])
        setCurrentThreadId(null)
        setError(loadError)
        setIsLoading(false)
        return
      }

      const nextThreads = data ?? []
      setThreads(nextThreads)
      setCurrentThreadId(nextThreads[0]?.id ?? null)
      setError(null)
      setIsLoading(false)
    }

    void loadThreads()

    return () => {
      isMounted = false
    }
  }, [currentProduct.id, isDiscoveryStage])

  useEffect(() => {
    if (!isDiscoveryStage || !currentThreadId) {
      setMessages([])
      setCandidates([])
      return
    }

    let isMounted = true

    async function loadThreadData() {
      const activeThreadId = currentThreadId
      if (!activeThreadId) {
        return
      }

      setIsLoading(true)
      const [messagesResult, candidatesResult] = await Promise.all([
        listDiscoveryMessagesForThread(activeThreadId),
        listRequirementCandidatesForThread(activeThreadId),
      ])

      if (!isMounted) {
        return
      }

      if (messagesResult.error) {
        setError(messagesResult.error)
        setIsLoading(false)
        return
      }

      if (candidatesResult.error) {
        setError(candidatesResult.error)
        setIsLoading(false)
        return
      }

      const nextMessages = (messagesResult.data ?? [])
        .filter((message) => message.role === "user" || message.role === "assistant")
        .map((message: DiscoveryMessageRecord) => ({
          id: message.id,
          role: message.role as "user" | "assistant",
          content: message.content,
        }))

      setMessages(nextMessages)
      setCandidates(candidatesResult.data ?? [])
      setError(null)
      setIsLoading(false)
    }

    void loadThreadData()

    return () => {
      isMounted = false
    }
  }, [currentThreadId, isDiscoveryStage])

  const threadOptions = useMemo(
    () => threads.map((thread) => ({ id: thread.id, title: thread.title })),
    [threads]
  )

  async function handleCreateThread() {
    setError(null)
    const { data, error: createError } = await createDiscoveryThread(
      currentProduct.id,
      "New Discovery Thread"
    )

    if (createError || !data) {
      setError(createError ?? "Unable to create thread.")
      return
    }

    setThreads((currentThreads) => [data, ...currentThreads])
    setCurrentThreadId(data.id)
    setMessages([])
    setCandidates([])
  }

  async function handleSendMessage() {
    const trimmedMessage = draftMessage.trim()
    if (!trimmedMessage || isSending) {
      return
    }

    setIsSending(true)
    setError(null)
    setDraftMessage("")

    const optimisticUserMessage: LocalChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: trimmedMessage,
    }

    setMessages((currentMessages) => [...currentMessages, optimisticUserMessage])

    let streamAssistantMessageId: string | null = null

    const { error: streamError } = await streamDiscoveryChat({
      productId: currentProduct.id,
      threadId: currentThreadId,
      message: trimmedMessage,
      onEvent: (event) => {
        if (event.event === "thread.created") {
          const createdThread: DiscoveryThreadRecord = {
            id: event.data.threadId,
            product_id: currentProduct.id,
            title: event.data.title,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          setThreads((currentThreads) => [createdThread, ...currentThreads])
          setCurrentThreadId(event.data.threadId)
          return
        }

        if (event.event === "candidate.upserted") {
          setCandidates((currentCandidates) => {
            const next = [...currentCandidates]
            const existingIndex = next.findIndex(
              (candidate) => candidate.id === event.data.candidate.id
            )

            if (existingIndex >= 0) {
              next[existingIndex] = event.data.candidate
            } else {
              next.push(event.data.candidate)
            }

            return next
          })
          return
        }

        if (event.event === "candidate.removed") {
          setCandidates((currentCandidates) =>
            currentCandidates.filter(
              (candidate) => candidate.id !== event.data.candidateId
            )
          )
          return
        }

        if (event.event === "message.delta") {
          setMessages((currentMessages) => {
            const next = [...currentMessages]
            const existingStreamingMessageIndex = next.findIndex(
              (message) => message.id === streamAssistantMessageId
            )

            if (existingStreamingMessageIndex >= 0) {
              next[existingStreamingMessageIndex] = {
                ...next[existingStreamingMessageIndex],
                content:
                  next[existingStreamingMessageIndex].content + event.data.content,
              }
              return next
            }

            const newStreamingId = `stream-${Date.now()}`
            streamAssistantMessageId = newStreamingId
            next.push({
              id: newStreamingId,
              role: "assistant",
              content: event.data.content,
              isStreaming: true,
            })
            return next
          })
          return
        }

        if (event.event === "message.completed") {
          setMessages((currentMessages) => {
            const next = [...currentMessages]
            const existingStreamingMessageIndex = next.findIndex(
              (message) => message.id === streamAssistantMessageId
            )

            if (existingStreamingMessageIndex >= 0) {
              next[existingStreamingMessageIndex] = {
                id: event.data.messageId,
                role: "assistant",
                content: event.data.content,
              }
              return next
            }

            next.push({
              id: event.data.messageId,
              role: "assistant",
              content: event.data.content,
            })
            return next
          })
          return
        }

        if (event.event === "error") {
          setError(event.data.message)
        }
      },
    })

    if (streamError) {
      setError(streamError)
    }

    setIsSending(false)
  }

  async function handlePromoteCandidate(candidateId: string) {
    setError(null)
    const { data, error: promoteError } = await promoteRequirementCandidate(
      candidateId
    )

    if (promoteError || !data) {
      setError(promoteError ?? "Unable to promote candidate.")
      return
    }

    setCandidates((currentCandidates) =>
      currentCandidates.map((candidate) =>
        candidate.id === candidateId
          ? {
              ...candidate,
              status: "accepted",
              metadata: {
                ...(candidate.metadata as Record<string, unknown>),
                promoted_requirement_id: data.id,
              },
            }
          : candidate
      )
    )
  }

  async function handleDiscardCandidate(candidateId: string) {
    setError(null)
    const { error: discardError } = await discardRequirementCandidate(candidateId)

    if (discardError) {
      setError(discardError)
      return
    }

    setCandidates((currentCandidates) =>
      currentCandidates.filter((candidate) => candidate.id !== candidateId)
    )
  }

  async function handleUnpromoteCandidate(candidateId: string) {
    setError(null)
    const { error: unpromoteError } = await unpromoteRequirementCandidate(candidateId)
    if (unpromoteError) {
      setError(unpromoteError)
      return
    }

    setCandidates((currentCandidates) =>
      currentCandidates.map((candidate) =>
        candidate.id === candidateId
          ? {
              ...candidate,
              status: "proposed",
            }
          : candidate
      )
    )
  }

  async function handlePromoteAll() {
    if (!candidates.length || isBulkUpdating) {
      return
    }

    setIsBulkUpdating(true)
    setError(null)

    for (const candidate of candidates) {
      if (candidate.status === "accepted") {
        continue
      }

      const { data, error: promoteError } = await promoteRequirementCandidate(
        candidate.id
      )
      if (promoteError || !data) {
        setError(promoteError ?? "Unable to promote all candidates.")
        setIsBulkUpdating(false)
        return
      }
    }

    setCandidates((currentCandidates) =>
      currentCandidates.map((candidate) => ({
        ...candidate,
        status: "accepted",
      }))
    )
    setIsBulkUpdating(false)
  }

  async function handleUnpromoteAll() {
    if (!candidates.length || isBulkUpdating) {
      return
    }

    setIsBulkUpdating(true)
    setError(null)

    for (const candidate of candidates) {
      if (candidate.status !== "accepted") {
        continue
      }

      const { error: unpromoteError } = await unpromoteRequirementCandidate(
        candidate.id
      )
      if (unpromoteError) {
        setError(unpromoteError)
        setIsBulkUpdating(false)
        return
      }
    }

    setCandidates((currentCandidates) =>
      currentCandidates.map((candidate) => ({
        ...candidate,
        status: "proposed",
      }))
    )
    setIsBulkUpdating(false)
  }

  async function handleRemoveAll() {
    if (!candidates.length || isBulkUpdating) {
      return
    }

    setIsBulkUpdating(true)
    setError(null)

    for (const candidate of candidates) {
      const { error: discardError } = await discardRequirementCandidate(candidate.id)
      if (discardError) {
        setError(discardError)
        setIsBulkUpdating(false)
        return
      }
    }

    setCandidates([])
    setIsBulkUpdating(false)
  }

  if (!isDiscoveryStage) {
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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <section className="shrink-0 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{stageTitle}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {currentProduct.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={currentThreadId ?? ""}
              onChange={(event) =>
                setCurrentThreadId(event.currentTarget.value || null)
              }
              className="h-9 min-w-56 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Select thread</option>
              {threadOptions.map((thread) => (
                <option key={thread.id} value={thread.id}>
                  {thread.title}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={handleCreateThread}>
              New Thread
            </Button>
          </div>
        </div>
      </section>

      <section className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[1.6fr_1fr]">
        <div className="flex min-h-0 flex-col rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <p className="text-sm font-medium">Conversation</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="flex min-h-full flex-col gap-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading thread...</p>
            ) : messages.length ? (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "assistant"
                      ? "max-w-[85%] rounded-xl border bg-muted/30 px-4 py-3 text-sm"
                      : "ml-auto max-w-[85%] rounded-xl border bg-primary px-4 py-3 text-sm text-primary-foreground"
                  }
                >
                  <p className="leading-6 whitespace-pre-wrap">{message.content}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Start by describing your product and goals. The assistant will
                propose requirement candidates.
              </p>
            )}
            </div>
          </div>
          <div className="shrink-0 border-t px-5 py-4">
            <div className="flex items-center gap-2">
              <Input
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                placeholder="Describe your product, constraints, and packaging ideas..."
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    void handleSendMessage()
                  }
                }}
              />
              <Button onClick={() => void handleSendMessage()} disabled={isSending}>
                {isSending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Requirement Candidates</p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!candidates.length || isBulkUpdating}
                  onClick={() => void handlePromoteAll()}
                >
                  Promote All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!candidates.length || isBulkUpdating}
                  onClick={() => void handleUnpromoteAll()}
                >
                  Unpromote All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!candidates.length || isBulkUpdating}
                  onClick={() => void handleRemoveAll()}
                >
                  Remove All
                </Button>
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="flex min-h-full flex-col gap-3">
            {candidates.length ? (
              candidates.map((candidate) => {
                const isAccepted = candidate.status === "accepted"
                return (
                  <div key={candidate.id} className="rounded-xl border p-4">
                    <p className="font-medium">{candidate.title}</p>
                    {candidate.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {candidate.description}
                      </p>
                    ) : null}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {candidate.category || "Uncategorized"}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBulkUpdating}
                          onClick={() =>
                            void (isAccepted
                              ? handleUnpromoteCandidate(candidate.id)
                              : handlePromoteCandidate(candidate.id))
                          }
                        >
                          {isAccepted ? "Unpromote" : "Promote"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBulkUpdating}
                          onClick={() => void handleDiscardCandidate(candidate.id)}
                        >
                          Discard
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                Candidate requirements will appear here as the chat evolves.
              </p>
            )}
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <p className="shrink-0 text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  )
}

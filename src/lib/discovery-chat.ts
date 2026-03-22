import type { Database } from "@/lib/database.types"
import { supabase } from "@/lib/supabase"

export type DiscoveryThreadRecord =
  Database["public"]["Tables"]["discovery_threads"]["Row"]
export type DiscoveryMessageRecord =
  Database["public"]["Tables"]["discovery_messages"]["Row"]
export type RequirementCandidateRecord =
  Database["public"]["Tables"]["requirement_candidates"]["Row"]

type Result<T> = {
  data: T | null
  error: string | null
}

export type DiscoveryStreamEvent =
  | {
      event: "thread.created"
      data: { threadId: string; title: string }
    }
  | {
      event: "message.delta"
      data: { content: string }
    }
  | {
      event: "candidate.upserted"
      data: { candidate: RequirementCandidateRecord }
    }
  | {
      event: "candidate.removed"
      data: { candidateId: string }
    }
  | {
      event: "message.completed"
      data: { messageId: string; content: string }
    }
  | {
      event: "error"
      data: { message: string }
    }

export async function listDiscoveryThreadsForProduct(
  productId: string
): Promise<Result<DiscoveryThreadRecord[]>> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { data, error } = await supabase
      .from("discovery_threads")
      .select("*")
      .eq("product_id", productId)
      .order("updated_at", { ascending: false })

    return {
      data: (data as DiscoveryThreadRecord[] | null) ?? [],
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Unable to load discovery threads.",
    }
  }
}

export async function createDiscoveryThread(
  productId: string,
  title: string
): Promise<Result<DiscoveryThreadRecord>> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { data, error } = await supabase
      .from("discovery_threads")
      .insert({
        product_id: productId,
        title,
      })
      .select("*")
      .single()

    return {
      data: (data as DiscoveryThreadRecord | null) ?? null,
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Unable to create discovery thread.",
    }
  }
}

export async function listDiscoveryMessagesForThread(
  threadId: string
): Promise<Result<DiscoveryMessageRecord[]>> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { data, error } = await supabase
      .from("discovery_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })

    return {
      data: (data as DiscoveryMessageRecord[] | null) ?? [],
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Unable to load discovery messages.",
    }
  }
}

export async function listRequirementCandidatesForThread(
  threadId: string
): Promise<Result<RequirementCandidateRecord[]>> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { data, error } = await supabase
      .from("requirement_candidates")
      .select("*")
      .eq("thread_id", threadId)
      .neq("status", "discarded")
      .order("created_at", { ascending: true })

    return {
      data: (data as RequirementCandidateRecord[] | null) ?? [],
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Unable to load requirement candidates.",
    }
  }
}

export async function discardRequirementCandidate(
  candidateId: string
): Promise<{ error: string | null }> {
  if (!supabase) {
    return {
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { error } = await supabase
      .from("requirement_candidates")
      .update({
        status: "discarded",
      })
      .eq("id", candidateId)

    return {
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to discard requirement candidate.",
    }
  }
}

function parseSSE(buffer: string): {
  events: DiscoveryStreamEvent[]
  rest: string
} {
  const chunks = buffer.split("\n\n")
  const rest = chunks.pop() ?? ""
  const events: DiscoveryStreamEvent[] = []

  for (const chunk of chunks) {
    const lines = chunk.split("\n")
    let eventName = ""
    let dataPayload = ""

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventName = line.slice("event:".length).trim()
      } else if (line.startsWith("data:")) {
        dataPayload += line.slice("data:".length).trim()
      }
    }

    if (!eventName || !dataPayload) {
      continue
    }

    try {
      const parsed = JSON.parse(dataPayload) as DiscoveryStreamEvent["data"]
      events.push({
        event: eventName as DiscoveryStreamEvent["event"],
        data: parsed as never,
      } as DiscoveryStreamEvent)
    } catch {
      // Ignore malformed stream chunks.
    }
  }

  return { events, rest }
}

export async function streamDiscoveryChat(input: {
  productId: string
  threadId?: string | null
  message: string
  onEvent: (event: DiscoveryStreamEvent) => void
}): Promise<{ error: string | null }> {
  if (!supabase) {
    return {
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()
    if (sessionError) {
      return { error: sessionError.message }
    }

    const accessToken = sessionData.session?.access_token
    if (!accessToken) {
      return { error: "No active session." }
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey =
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
      import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return { error: "Supabase environment variables are missing." }
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/chat-discovery-stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          Authorization: `Bearer ${accessToken}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          productId: input.productId,
          threadId: input.threadId ?? null,
          message: input.message,
        }),
      }
    )

    if (!response.ok || !response.body) {
      const bodyText = await response.text()
      return {
        error: bodyText || "Unable to start discovery chat stream.",
      }
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const { events, rest } = parseSSE(buffer)
      buffer = rest

      for (const event of events) {
        input.onEvent(event)
      }
    }

    return { error: null }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to stream discovery chat.",
    }
  }
}

import { createClient } from "npm:@supabase/supabase-js@2.57.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

type CandidateRow = {
  id: string
  thread_id: string
  product_id: string
  source_message_id: string | null
  title: string
  description: string | null
  category: string | null
  status: "proposed" | "accepted" | "discarded"
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

type OpenAIToolCall = {
  id: string
  function: {
    name: string
    arguments: string
  }
}

type OpenAIMessage = {
  role: "system" | "user" | "assistant" | "tool"
  content: string
  tool_call_id?: string
  tool_calls?: OpenAIToolCall[]
}

function parseAssistantContent(content: unknown): string {
  if (typeof content === "string") {
    return content
  }

  if (!Array.isArray(content)) {
    return ""
  }

  return content
    .map((item) => {
      if (
        item &&
        typeof item === "object" &&
        "type" in item &&
        item.type === "text" &&
        "text" in item &&
        typeof item.text === "string"
      ) {
        return item.text
      }

      return ""
    })
    .join("")
}

function chunkText(text: string, chunkSize = 12) {
  const chunks: string[] = []
  for (let index = 0; index < text.length; index += chunkSize) {
    chunks.push(text.slice(index, index + chunkSize))
  }
  return chunks
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed.",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const openAIKey = Deno.env.get("OPENAI_API_KEY")
  const openAIModel = Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini"

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({
        error: "Missing Supabase environment variables.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }

  if (!openAIKey) {
    return new Response(
      JSON.stringify({
        error: "Missing OPENAI_API_KEY for edge function.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({
        error: "Missing auth token.",
      }),
      {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  })

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    return new Response(
      JSON.stringify({
        error: authError?.message ?? "Unauthenticated request.",
      }),
      {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }

  const body = (await req.json()) as {
    productId?: string
    threadId?: string | null
    message?: string
  }

  const productId = body.productId?.trim()
  const threadId = body.threadId?.trim() || null
  const userMessage = body.message?.trim()

  if (!productId || !userMessage) {
    return new Response(
      JSON.stringify({
        error: "Missing productId or message.",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }

  const { data: ownedProduct, error: ownedProductError } = await supabase
    .from("products")
    .select("id, name, category, description, user_id")
    .eq("id", productId)
    .maybeSingle()

  if (ownedProductError || !ownedProduct) {
    return new Response(
      JSON.stringify({
        error: ownedProductError?.message ?? "Product not found.",
      }),
      {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }

  const stream = new ReadableStream({
    start(controller) {
      const emit = (event: string, payload: Record<string, unknown>) => {
        controller.enqueue(
          new TextEncoder().encode(
            `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`
          )
        )
      }

      const run = async () => {
        try {
          let activeThreadId = threadId

          if (activeThreadId) {
            const { data: threadData, error: threadError } = await supabase
              .from("discovery_threads")
              .select("id")
              .eq("id", activeThreadId)
              .eq("product_id", productId)
              .maybeSingle()

            if (threadError || !threadData) {
              throw new Error(threadError?.message ?? "Thread not found.")
            }
          } else {
            const threadTitle =
              userMessage.length > 56
                ? `${userMessage.slice(0, 56)}...`
                : userMessage

            const { data: createdThread, error: createThreadError } = await supabase
              .from("discovery_threads")
              .insert({
                product_id: productId,
                title: threadTitle || "Discovery Thread",
              })
              .select("*")
              .single()

            if (createThreadError || !createdThread) {
              throw new Error(
                createThreadError?.message ?? "Unable to create thread."
              )
            }

            activeThreadId = createdThread.id
            emit("thread.created", {
              threadId: createdThread.id,
              title: createdThread.title,
            })
          }

          const { data: insertedUserMessage, error: insertUserMessageError } =
            await supabase
              .from("discovery_messages")
              .insert({
                thread_id: activeThreadId,
                role: "user",
                content: userMessage,
                metadata: {},
              })
              .select("*")
              .single()

          if (insertUserMessageError || !insertedUserMessage) {
            throw new Error(
              insertUserMessageError?.message ?? "Unable to store user message."
            )
          }

          const { data: historyRows, error: historyError } = await supabase
            .from("discovery_messages")
            .select("id, role, content")
            .eq("thread_id", activeThreadId)
            .in("role", ["user", "assistant", "system"])
            .order("created_at", { ascending: true })

          if (historyError) {
            throw new Error(historyError.message)
          }

          const { data: existingCandidates, error: existingCandidatesError } =
            await supabase
              .from("requirement_candidates")
              .select("id, title, category, description, status")
              .eq("thread_id", activeThreadId)
              .neq("status", "discarded")
              .order("created_at", { ascending: true })

          if (existingCandidatesError) {
            throw new Error(existingCandidatesError.message)
          }

          const systemPrompt = `You are a product decomposition assistant.
Your job is to help the user break their product into sourceable requirements.

When you identify requirement ideas, call tools:
- add_candidate
- update_candidate
- remove_candidate

Only manipulate candidate items. Do not claim that requirements are final.

Product context:
- name: ${ownedProduct.name}
- category: ${ownedProduct.category ?? "n/a"}
- description: ${ownedProduct.description ?? "n/a"}

Current candidate list:
${JSON.stringify(existingCandidates ?? [])}
`

          const messages: OpenAIMessage[] = [
            {
              role: "system",
              content: systemPrompt,
            },
            ...(historyRows ?? []).map((row) => ({
              role: row.role as OpenAIMessage["role"],
              content: row.content,
            })),
          ]

          const tools = [
            {
              type: "function",
              function: {
                name: "add_candidate",
                description: "Add a new requirement candidate.",
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    category: { type: "string" },
                  },
                  required: ["title"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "update_candidate",
                description: "Update an existing requirement candidate.",
                parameters: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    category: { type: "string" },
                  },
                  required: ["id"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "remove_candidate",
                description: "Remove a requirement candidate by id.",
                parameters: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                  },
                  required: ["id"],
                },
              },
            },
          ]

          const executeToolCall = async (toolCall: OpenAIToolCall) => {
            let args: Record<string, unknown> = {}
            try {
              args = toolCall.function.arguments
                ? (JSON.parse(toolCall.function.arguments) as Record<
                    string,
                    unknown
                  >)
                : {}
            } catch {
              return {
                ok: false,
                error: "Invalid tool call JSON arguments.",
              }
            }

            if (toolCall.function.name === "add_candidate") {
              const title =
                typeof args.title === "string" ? args.title.trim() : ""
              const description =
                typeof args.description === "string"
                  ? args.description.trim()
                  : null
              const category =
                typeof args.category === "string" ? args.category.trim() : null

              if (!title) {
                return {
                  ok: false,
                  error: "Title is required.",
                }
              }

              const { data: createdCandidate, error: createdCandidateError } =
                await supabase
                  .from("requirement_candidates")
                  .insert({
                    thread_id: activeThreadId,
                    product_id: productId,
                    source_message_id: insertedUserMessage.id,
                    title,
                    description,
                    category,
                    status: "proposed",
                    metadata: {},
                  })
                  .select("*")
                  .single()

              if (createdCandidateError || !createdCandidate) {
                return {
                  ok: false,
                  error:
                    createdCandidateError?.message ??
                    "Unable to create candidate.",
                }
              }

              emit("candidate.upserted", {
                candidate: createdCandidate,
              })

              return {
                ok: true,
                candidate: createdCandidate,
              }
            }

            if (toolCall.function.name === "update_candidate") {
              const id = typeof args.id === "string" ? args.id.trim() : ""
              if (!id) {
                return {
                  ok: false,
                  error: "Candidate id is required.",
                }
              }

              const updates: {
                title?: string
                description?: string | null
                category?: string | null
              } = {}

              if (typeof args.title === "string") {
                updates.title = args.title.trim()
              }
              if (typeof args.description === "string") {
                updates.description = args.description.trim()
              }
              if (typeof args.category === "string") {
                updates.category = args.category.trim()
              }

              const { data: updatedCandidate, error: updatedCandidateError } =
                await supabase
                  .from("requirement_candidates")
                  .update(updates)
                  .eq("id", id)
                  .eq("thread_id", activeThreadId)
                  .eq("product_id", productId)
                  .select("*")
                  .single()

              if (updatedCandidateError || !updatedCandidate) {
                return {
                  ok: false,
                  error:
                    updatedCandidateError?.message ??
                    "Unable to update candidate.",
                }
              }

              emit("candidate.upserted", {
                candidate: updatedCandidate,
              })

              return {
                ok: true,
                candidate: updatedCandidate,
              }
            }

            if (toolCall.function.name === "remove_candidate") {
              const id = typeof args.id === "string" ? args.id.trim() : ""
              if (!id) {
                return {
                  ok: false,
                  error: "Candidate id is required.",
                }
              }

              const { error: discardError } = await supabase
                .from("requirement_candidates")
                .update({
                  status: "discarded",
                })
                .eq("id", id)
                .eq("thread_id", activeThreadId)
                .eq("product_id", productId)

              if (discardError) {
                return {
                  ok: false,
                  error: discardError.message,
                }
              }

              emit("candidate.removed", {
                candidateId: id,
              })

              return {
                ok: true,
                candidateId: id,
              }
            }

            return {
              ok: false,
              error: `Unsupported tool: ${toolCall.function.name}`,
            }
          }

          let finalAssistantText = ""

          for (let iteration = 0; iteration < 6; iteration += 1) {
            const completionResponse = await fetch(
              "https://api.openai.com/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${openAIKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: openAIModel,
                  messages,
                  tools,
                  tool_choice: "auto",
                  temperature: 0.4,
                }),
              }
            )

            if (!completionResponse.ok) {
              const failureText = await completionResponse.text()
              throw new Error(
                `OpenAI completion failed: ${completionResponse.status} ${failureText}`
              )
            }

            const completion = (await completionResponse.json()) as {
              choices?: Array<{
                message?: {
                  content?: unknown
                  tool_calls?: OpenAIToolCall[]
                }
              }>
            }

            const assistantMessage = completion.choices?.[0]?.message
            if (!assistantMessage) {
              throw new Error("Assistant response missing.")
            }

            const assistantText = parseAssistantContent(assistantMessage.content)
            const toolCalls = assistantMessage.tool_calls ?? []

            if (toolCalls.length === 0) {
              finalAssistantText = assistantText || "Got it."
              break
            }

            messages.push({
              role: "assistant",
              content: assistantText || "",
              tool_calls: toolCalls,
            })

            for (const toolCall of toolCalls) {
              const toolResult = await executeToolCall(toolCall)

              const { error: toolMessageError } = await supabase
                .from("discovery_messages")
                .insert({
                  thread_id: activeThreadId,
                  role: "tool",
                  content: JSON.stringify(toolResult),
                  metadata: {
                    tool_call_id: toolCall.id,
                    tool_name: toolCall.function.name,
                  },
                })

              if (toolMessageError) {
                throw new Error(toolMessageError.message)
              }

              messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(toolResult),
              })
            }
          }

          const { data: assistantMessageRow, error: assistantMessageError } =
            await supabase
              .from("discovery_messages")
              .insert({
                thread_id: activeThreadId,
                role: "assistant",
                content: finalAssistantText,
                metadata: {},
              })
              .select("*")
              .single()

          if (assistantMessageError || !assistantMessageRow) {
            throw new Error(
              assistantMessageError?.message ??
                "Unable to store assistant message response."
            )
          }

          const { error: touchThreadError } = await supabase
            .from("discovery_threads")
            .update({
              updated_at: new Date().toISOString(),
            })
            .eq("id", activeThreadId)

          if (touchThreadError) {
            throw new Error(touchThreadError.message)
          }

          for (const chunk of chunkText(finalAssistantText)) {
            emit("message.delta", { content: chunk })
          }

          emit("message.completed", {
            messageId: assistantMessageRow.id,
            content: finalAssistantText,
          })
        } catch (error) {
          emit("error", {
            message:
              error instanceof Error
                ? error.message
                : "Unexpected stream failure.",
          })
        } finally {
          controller.close()
        }
      }

      void run()
    },
  })

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
})

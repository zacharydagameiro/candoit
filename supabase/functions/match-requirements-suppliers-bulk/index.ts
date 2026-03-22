import { createClient } from "npm:@supabase/supabase-js@2.57.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

type MatchRequestBody = {
  limit?: number
  topK?: number
  dryRun?: boolean
}

type ProductContext = {
  name: string | null
  category: string | null
  description: string | null
}

type QueueRequirementRow = {
  id: string
  product_id: string
  title: string
  description: string | null
  category: string | null
  products: unknown
}

type ClaimedRequirement = {
  id: string
  productId: string
  title: string
  description: string | null
  category: string | null
  productContext: ProductContext | null
}

type SupplierMatchRow = {
  supplier_id: string
  similarity: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function vectorToLiteral(values: number[]): string {
  return `[${values.join(",")}]`
}

function toFitScore(similarity: number): number {
  const normalized = Number.isFinite(similarity) ? similarity : 0
  return Number((clamp(normalized, 0, 1) * 100).toFixed(2))
}

function parseProductContext(value: unknown): ProductContext | null {
  const row = Array.isArray(value) ? value[0] : value
  if (!row || typeof row !== "object") {
    return null
  }

  const maybeName =
    "name" in row && typeof row.name === "string" ? row.name : null
  const maybeCategory =
    "category" in row && typeof row.category === "string" ? row.category : null
  const maybeDescription =
    "description" in row && typeof row.description === "string"
      ? row.description
      : null

  return {
    name: maybeName,
    category: maybeCategory,
    description: maybeDescription,
  }
}

function buildRequirementEmbeddingText(requirement: ClaimedRequirement): string {
  const product = requirement.productContext

  return [
    `Requirement title: ${requirement.title}.`,
    `Requirement description: ${requirement.description ?? "None"}.`,
    `Requirement category: ${requirement.category ?? "None"}.`,
    `Product name: ${product?.name ?? "Unknown"}.`,
    `Product category: ${product?.category ?? "Unknown"}.`,
    `Product description: ${product?.description ?? "None"}.`,
    "Task: find the most relevant suppliers for this requirement.",
  ].join(" ")
}

async function revertRequirementsToQueued(
  supabase: ReturnType<typeof createClient>,
  requirementIds: string[]
) {
  if (requirementIds.length === 0) {
    return
  }

  await supabase
    .from("requirements")
    .update({ status: "queued" })
    .in("id", requirementIds)
    .eq("status", "finding")
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
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const openAIKey = Deno.env.get("OPENAI_API_KEY")
  const embeddingModel =
    Deno.env.get("OPENAI_EMBEDDING_MODEL") ?? "text-embedding-3-small"

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response(
      JSON.stringify({
        error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
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
        error: "Missing OPENAI_API_KEY.",
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

  const body = (await req.json().catch(() => ({}))) as MatchRequestBody
  const limit = clamp(body.limit ?? 100, 1, 500)
  const topK = clamp(body.topK ?? 10, 1, 25)
  const dryRun = body.dryRun ?? false

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  const { data: queuedRowsData, error: queuedRowsError } = await supabase
    .from("requirements")
    .select(
      "id, product_id, title, description, category, products(name, category, description)"
    )
    .eq("status", "queued")
    .order("updated_at", { ascending: true })
    .limit(limit)

  if (queuedRowsError) {
    return new Response(
      JSON.stringify({
        error: queuedRowsError.message,
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

  const queuedRows = (queuedRowsData ?? []) as QueueRequirementRow[]
  if (queuedRows.length === 0) {
    return new Response(
      JSON.stringify({
        success: true,
        requested: limit,
        queued: 0,
        claimed: 0,
        processed: 0,
        matched: 0,
        zeroMatch: 0,
        failed: 0,
        errors: [],
        dryRun,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }

  const productContextByRequirementId = new Map<string, ProductContext | null>()
  for (const row of queuedRows) {
    productContextByRequirementId.set(row.id, parseProductContext(row.products))
  }

  const targets: ClaimedRequirement[] = []
  const claimErrors: Array<{ requirementId: string; error: string }> = []

  if (dryRun) {
    for (const row of queuedRows) {
      targets.push({
        id: row.id,
        productId: row.product_id,
        title: row.title,
        description: row.description,
        category: row.category,
        productContext: productContextByRequirementId.get(row.id) ?? null,
      })
    }
  } else {
    for (const row of queuedRows) {
      const { data: claimedRow, error: claimError } = await supabase
        .from("requirements")
        .update({
          status: "finding",
        })
        .eq("id", row.id)
        .eq("status", "queued")
        .select("id, product_id, title, description, category")
        .maybeSingle()

      if (claimError) {
        claimErrors.push({
          requirementId: row.id,
          error: claimError.message,
        })
        continue
      }

      if (!claimedRow) {
        continue
      }

      targets.push({
        id: claimedRow.id,
        productId: claimedRow.product_id,
        title: claimedRow.title,
        description: claimedRow.description,
        category: claimedRow.category,
        productContext: productContextByRequirementId.get(row.id) ?? null,
      })
    }
  }

  if (targets.length === 0) {
    return new Response(
      JSON.stringify({
        success: true,
        requested: limit,
        queued: queuedRows.length,
        claimed: 0,
        processed: 0,
        matched: 0,
        zeroMatch: 0,
        failed: claimErrors.length,
        errors: claimErrors,
        dryRun,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }

  const requirementInputs = targets.map((requirement) =>
    buildRequirementEmbeddingText(requirement)
  )

  const embeddingsResponse = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: embeddingModel,
      input: requirementInputs,
    }),
  })

  if (!embeddingsResponse.ok) {
    const failureText = await embeddingsResponse.text()

    if (!dryRun) {
      await revertRequirementsToQueued(
        supabase,
        targets.map((target) => target.id)
      )
    }

    return new Response(
      JSON.stringify({
        error: `OpenAI embeddings failed: ${embeddingsResponse.status} ${failureText}`,
      }),
      {
        status: 502,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }

  const embeddingsPayload = (await embeddingsResponse.json()) as {
    data?: Array<{ index: number; embedding: number[] }>
  }

  const embeddingsByIndex = new Map<number, number[]>(
    (embeddingsPayload.data ?? []).map((row) => [row.index, row.embedding])
  )

  let processed = 0
  let matched = 0
  let zeroMatch = 0
  let failed = claimErrors.length
  const errors: Array<{ requirementId: string; error: string }> = [...claimErrors]

  for (let index = 0; index < targets.length; index += 1) {
    const target = targets[index]
    const embedding = embeddingsByIndex.get(index)

    try {
      if (!embedding) {
        throw new Error("Missing embedding vector for requirement.")
      }

      const { data: matchRowsData, error: matchRowsError } = await supabase.rpc(
        "match_suppliers_by_embedding",
        {
          query_embedding: vectorToLiteral(embedding),
          match_count: topK,
        }
      )

      if (matchRowsError) {
        throw new Error(matchRowsError.message)
      }

      const matchRows = (matchRowsData ?? []) as SupplierMatchRow[]

      if (!dryRun) {
        const { error: deleteCandidatesError } = await supabase
          .from("requirement_suppliers")
          .delete()
          .eq("requirement_id", target.id)
          .eq("match_status", "candidate")

        if (deleteCandidatesError) {
          throw new Error(deleteCandidatesError.message)
        }

        if (matchRows.length > 0) {
          const newCandidateLinks = matchRows.map((row, matchIndex) => ({
            requirement_id: target.id,
            supplier_id: row.supplier_id,
            fit_score: toFitScore(row.similarity),
            match_status: "candidate" as const,
            notes: `auto_match_v1 rank=${matchIndex + 1} similarity=${row.similarity.toFixed(6)}`,
          }))

          const { error: upsertCandidatesError } = await supabase
            .from("requirement_suppliers")
            .upsert(newCandidateLinks, {
              onConflict: "requirement_id,supplier_id",
              ignoreDuplicates: true,
            })

          if (upsertCandidatesError) {
            throw new Error(upsertCandidatesError.message)
          }
        }

        const { error: markFoundError } = await supabase
          .from("requirements")
          .update({
            status: "found",
          })
          .eq("id", target.id)
          .eq("status", "finding")

        if (markFoundError) {
          throw new Error(markFoundError.message)
        }
      }

      processed += 1
      if (matchRows.length > 0) {
        matched += 1
      } else {
        zeroMatch += 1
      }
    } catch (error) {
      failed += 1
      errors.push({
        requirementId: target.id,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected matching error.",
      })

      if (!dryRun) {
        await supabase
          .from("requirements")
          .update({
            status: "queued",
          })
          .eq("id", target.id)
          .eq("status", "finding")
      }
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      requested: limit,
      queued: queuedRows.length,
      claimed: targets.length,
      processed,
      matched,
      zeroMatch,
      failed,
      errors,
      model: embeddingModel,
      topK,
      dryRun,
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  )
})

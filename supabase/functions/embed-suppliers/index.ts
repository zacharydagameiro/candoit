import { createClient } from "npm:@supabase/supabase-js@2.57.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

type SupplierRow = {
  id: string
  name: string
  website: string | null
  contact_url: string | null
  country: string | null
  region: string | null
  products: string[] | null
  notes: string | null
  embedding: string | null
}

type EmbeddingRequestBody = {
  limit?: number
  onlyMissing?: boolean
  dryRun?: boolean
}

function vectorToLiteral(values: number[]): string {
  return `[${values.join(",")}]`
}

function buildSupplierEmbeddingText(supplier: SupplierRow): string {
  const products =
    supplier.products && supplier.products.length > 0
      ? supplier.products.join(", ")
      : "Not specified"

  return [
    `Supplier name: ${supplier.name}.`,
    `Supplier products/capabilities: ${products}.`,
    `Supplier notes: ${supplier.notes ?? "None"}.`,
    "Use this supplier profile for requirement-to-supplier matching.",
  ].join(" ")
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

  const body = (await req.json().catch(() => ({}))) as EmbeddingRequestBody
  const limit = Math.min(Math.max(body.limit ?? 100, 1), 500)
  const onlyMissing = body.onlyMissing ?? true
  const dryRun = body.dryRun ?? false

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  let supplierQuery = supabase
    .from("suppliers")
    .select(
      "id, name, website, contact_url, country, region, products, notes, embedding"
    )
    .order("created_at", { ascending: true })
    .limit(limit)

  if (onlyMissing) {
    supplierQuery = supplierQuery.is("embedding", null)
  }

  const { data: suppliers, error: suppliersError } = await supplierQuery
  if (suppliersError) {
    return new Response(
      JSON.stringify({
        error: suppliersError.message,
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

  const rows = (suppliers ?? []) as SupplierRow[]
  if (rows.length === 0) {
    return new Response(
      JSON.stringify({
        success: true,
        processed: 0,
        updated: 0,
        message: "No suppliers matched the filter.",
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

  const embeddingInputs = rows.map((supplier) =>
    buildSupplierEmbeddingText(supplier)
  )

  if (dryRun) {
    return new Response(
      JSON.stringify({
        success: true,
        processed: rows.length,
        updated: 0,
        model: embeddingModel,
        sample: embeddingInputs.slice(0, 3),
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

  const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: embeddingModel,
      input: embeddingInputs,
    }),
  })

  if (!embeddingResponse.ok) {
    const failureText = await embeddingResponse.text()
    return new Response(
      JSON.stringify({
        error: `OpenAI embeddings failed: ${embeddingResponse.status} ${failureText}`,
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

  const embeddingPayload = (await embeddingResponse.json()) as {
    data?: Array<{ index: number; embedding: number[] }>
  }

  const vectorsByIndex = new Map<number, number[]>(
    (embeddingPayload.data ?? []).map((row) => [row.index, row.embedding])
  )

  const updates = rows.map((supplier, index) => {
    const vector = vectorsByIndex.get(index)
    return {
      id: supplier.id,
      vector,
    }
  })

  let updatedCount = 0
  for (const update of updates) {
    if (!update.vector) {
      continue
    }

    const { error: updateError } = await supabase
      .from("suppliers")
      .update({
        embedding: vectorToLiteral(update.vector),
      })
      .eq("id", update.id)

    if (updateError) {
      return new Response(
        JSON.stringify({
          error: `Failed to update supplier embedding for ${update.id}: ${updateError.message}`,
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

    updatedCount += 1
  }

  return new Response(
    JSON.stringify({
      success: true,
      processed: rows.length,
      updated: updatedCount,
      model: embeddingModel,
      onlyMissing,
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

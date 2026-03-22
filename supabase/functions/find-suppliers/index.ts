import "@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-find-suppliers-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
} as const

type RequirementRow = {
  id: string
  product_id?: string
  title: string
  description: string | null
  category: string | null
  status: string | null
}

type RequirementStatus = "ready" | "queued" | "finding" | "found" | "archived"

type SupplierInput = {
  name?: unknown
  website?: unknown
  email?: unknown
  phone?: unknown
  country?: unknown
  notes?: unknown
}

type SupplierRecord = {
  name: string
  website: string
  email: string | null
  phone: string | null
  country: string | null
  notes: string | null
}

type RequestBody = {
  requirementId?: string
}

class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  })
}

function toNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeWebsite(rawWebsite: string | null) {
  if (!rawWebsite) {
    return null
  }

  const withProtocol = /^[a-z]+:\/\//i.test(rawWebsite)
    ? rawWebsite
    : `https://${rawWebsite}`

  try {
    const url = new URL(withProtocol)
    url.hash = ""
    url.search = ""
    url.pathname = url.pathname.replace(/\/+$/, "")
    return url.toString()
  } catch {
    return null
  }
}

function parseSupplier(rawSupplier: SupplierInput) {
  const name = toNullableString(rawSupplier.name)
  const website = normalizeWebsite(toNullableString(rawSupplier.website))

  if (!name || !website) {
    return null
  }

  return {
    name,
    website,
    email: toNullableString(rawSupplier.email),
    phone: toNullableString(rawSupplier.phone),
    country: toNullableString(rawSupplier.country),
    notes: toNullableString(rawSupplier.notes),
  } satisfies SupplierRecord
}

function parseSupplierArray(rawOutput: string) {
  const trimmed = rawOutput.trim()
  const startIndex = trimmed.indexOf("[")
  const endIndex = trimmed.lastIndexOf("]")

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new HttpError(502, "Supplier search did not return a JSON array")
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(trimmed.slice(startIndex, endIndex + 1))
  } catch {
    throw new HttpError(502, "Supplier search returned invalid JSON")
  }

  if (!Array.isArray(parsed)) {
    throw new HttpError(502, "Supplier search did not return an array")
  }

  const deduped = new Map<string, SupplierRecord>()

  for (const supplier of parsed) {
    const normalizedSupplier = parseSupplier((supplier ?? {}) as SupplierInput)
    if (!normalizedSupplier) {
      continue
    }

    deduped.set(normalizedSupplier.website, normalizedSupplier)
  }

  return [...deduped.values()]
}

async function parseBody(req: Request) {
  const contentType = req.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) {
    return {}
  }

  try {
    return (await req.json()) as RequestBody
  } catch {
    throw new HttpError(400, "Request body must be valid JSON")
  }
}

function getRequirementId(req: Request, body: RequestBody) {
  const bodyId = toNullableString(body.requirementId)
  if (bodyId) {
    return bodyId
  }

  const pathSegments = new URL(req.url).pathname.split("/").filter(Boolean)
  const trailingSegment = pathSegments.at(-1)

  if (trailingSegment && trailingSegment !== "find-suppliers") {
    return trailingSegment
  }

  throw new HttpError(400, "Missing requirementId")
}

function verifySharedSecret(req: Request) {
  const expectedSecret = Deno.env.get("FIND_SUPPLIERS_SHARED_SECRET")

  if (!expectedSecret) {
    return
  }

  const providedSecret = req.headers.get("x-find-suppliers-secret")
  if (providedSecret !== expectedSecret) {
    throw new HttpError(401, "Invalid supplier search secret")
  }
}

async function loadRequirement(
  supabase: ReturnType<typeof createClient>,
  requirementId: string,
) {
  const { data, error } = await supabase
    .from("requirements")
    .select("id, product_id, title, description, category, status")
    .eq("id", requirementId)
    .maybeSingle<RequirementRow>()

  if (error) {
    throw new HttpError(500, `Failed to load requirement: ${error.message}`)
  }

  if (!data) {
    throw new HttpError(404, "Requirement not found")
  }

  return data
}

async function setRequirementStatus(
  supabase: ReturnType<typeof createClient>,
  requirementId: string,
  status: RequirementStatus,
) {
  const { error } = await supabase
    .from("requirements")
    .update({ status })
    .eq("id", requirementId)

  if (error) {
    throw new HttpError(
      500,
      `Failed to update requirement status to ${status}: ${error.message}`,
    )
  }
}

async function runLocalPiCommand(requirement: RequirementRow) {
  const prompt = `/find-suppliers "${requirement.title}"${
    requirement.category ? ` in category "${requirement.category}"` : ""
  }${requirement.description ? ` with notes "${requirement.description}"` : ""}`

  const command = new Deno.Command("pi", {
    args: ["-p", "--mode", "json", "--skill", "brave-search", prompt],
    stderr: "piped",
    stdout: "piped",
  })

  const output = await command.output()
  const stdout = new TextDecoder().decode(output.stdout)
  const stderr = new TextDecoder().decode(output.stderr)

  if (!output.success) {
    throw new HttpError(
      502,
      `Local pi command failed${stderr ? `: ${stderr.trim()}` : ""}`,
    )
  }

  return stdout
}

async function runRemoteSearch(requirement: RequirementRow) {
  const endpoint = Deno.env.get("PI_SEARCH_ENDPOINT") ??
    Deno.env.get("LOCAL_PI_SERVER_URL")
  if (!endpoint) {
    return null
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(Deno.env.get("PI_SEARCH_API_KEY")
        ? { Authorization: `Bearer ${Deno.env.get("PI_SEARCH_API_KEY")}` }
        : {}),
    },
    body: JSON.stringify({
      category: requirement.category,
      description: requirement.description,
      query: `${requirement.title} suppliers wholesale manufacturing`,
      requirementId: requirement.id,
      title: requirement.title,
    }),
  })

  if (!response.ok) {
    throw new HttpError(
      502,
      `Remote supplier search failed with ${response.status}`,
    )
  }

  return await response.text()
}

async function searchSuppliers(requirement: RequirementRow) {
  const remoteResult = await runRemoteSearch(requirement)
  if (remoteResult) {
    return parseSupplierArray(remoteResult)
  }

  if (Deno.env.get("ALLOW_LOCAL_PI_COMMAND") === "true") {
    const localResult = await runLocalPiCommand(requirement)
    return parseSupplierArray(localResult)
  }

  throw new HttpError(
    500,
    "No supplier search backend configured. Set PI_SEARCH_ENDPOINT, LOCAL_PI_SERVER_URL, or ALLOW_LOCAL_PI_COMMAND=true.",
  )
}

async function upsertSuppliers(
  supabase: ReturnType<typeof createClient>,
  suppliers: SupplierRecord[],
) {
  if (suppliers.length === 0) {
    return []
  }

  const storedSuppliers: Array<{ id: string; website: string | null }> = []

  for (const supplier of suppliers) {
    const { data: existingSupplier, error: existingError } = await supabase
      .from("suppliers")
      .select("id, website")
      .eq("website", supplier.website)
      .limit(1)
      .maybeSingle()

    if (existingError) {
      throw new HttpError(
        500,
        `Failed to lookup supplier by website: ${existingError.message}`,
      )
    }

    if (existingSupplier) {
      storedSuppliers.push(existingSupplier)
      continue
    }

    const { data: insertedSupplier, error: insertError } = await supabase
      .from("suppliers")
      .insert(supplier)
      .select("id, website")
      .single()

    if (insertError) {
      throw new HttpError(500, `Failed to insert supplier: ${insertError.message}`)
    }

    storedSuppliers.push(insertedSupplier)
  }

  return storedSuppliers
}

async function linkSuppliersToRequirement(
  supabase: ReturnType<typeof createClient>,
  requirementId: string,
  suppliers: Array<{ id: string }>,
) {
  if (suppliers.length === 0) {
    return
  }

  const links = suppliers.map((supplier) => ({
    requirement_id: requirementId,
    supplier_id: supplier.id,
    match_status: "candidate",
  }))

  const supplierIds = suppliers.map((supplier) => supplier.id)
  const { data: existingLinks, error: existingLinksError } = await supabase
    .from("requirement_suppliers")
    .select("supplier_id")
    .eq("requirement_id", requirementId)
    .in("supplier_id", supplierIds)

  if (existingLinksError) {
    throw new HttpError(
      500,
      `Failed to lookup existing requirement links: ${existingLinksError.message}`,
    )
  }

  const existingSupplierIds = new Set(
    (existingLinks ?? []).map((link) => link.supplier_id as string),
  )

  const missingLinks = links.filter((link) => !existingSupplierIds.has(link.supplier_id))
  if (missingLinks.length === 0) {
    return
  }

  const { error } = await supabase.from("requirement_suppliers").insert(missingLinks)

  if (error) {
    throw new HttpError(
      500,
      `Failed to link suppliers to requirement: ${error.message}`,
    )
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" })
  }

  try {
    verifySharedSecret(req)

    const body = await parseBody(req)
    const requirementId = getRequirementId(req, body)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !serviceRoleKey) {
      throw new HttpError(
        500,
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const requirement = await loadRequirement(supabase, requirementId)
    await setRequirementStatus(supabase, requirement.id, "finding")

    try {
      const suppliers = await searchSuppliers(requirement)

      if (suppliers.length === 0) {
        await setRequirementStatus(supabase, requirement.id, "ready")
        return jsonResponse(200, {
          requirementId: requirement.id,
          status: "ready",
          suppliersFound: 0,
        })
      }

      const storedSuppliers = await upsertSuppliers(supabase, suppliers)
      await linkSuppliersToRequirement(supabase, requirement.id, storedSuppliers)
      await setRequirementStatus(supabase, requirement.id, "found")

      return jsonResponse(200, {
        requirementId: requirement.id,
        status: "found",
        suppliers: suppliers,
        suppliersFound: storedSuppliers.length,
      })
    } catch (error) {
      await setRequirementStatus(supabase, requirement.id, "ready")
      throw error
    }
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(error.status, { error: error.message })
    }

    const message = error instanceof Error ? error.message : "Unexpected error"
    return jsonResponse(500, { error: message })
  }
})

import type { Database, Json } from "@/lib/database.types"
import { supabase } from "@/lib/supabase"

export type RequirementRecord = Database["public"]["Tables"]["requirements"]["Row"]
export type RequirementStatus = Database["public"]["Enums"]["requirement_status"]
export type UserSettableRequirementStatus = "ready" | "queued"
export type RequirementCandidateRecord =
  Database["public"]["Tables"]["requirement_candidates"]["Row"]
export type RequirementSupplierLinkRecord =
  Database["public"]["Tables"]["requirement_suppliers"]["Row"]
export type RequirementWithFoundCount = RequirementRecord & {
  amountFound: number
}
export type RequirementSupplierSummary = {
  linkId: string
  supplierId: string
  supplierName: string
  website: string | null
  contactUrl: string | null
  region: string | null
  products: string[]
  fitScore: number | null
  matchStatus: Database["public"]["Enums"]["requirement_match_status"]
  outreachState: "pending" | "ready" | "contacting" | "contacted" | "failed"
}

type Result<T> = {
  data: T | null
  error: string | null
}

function parseMetadata(
  metadata: Json
): {
  promoted_requirement_id?: string
} {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {}
  }

  const maybeId = metadata.promoted_requirement_id
  return typeof maybeId === "string"
    ? { promoted_requirement_id: maybeId }
    : {}
}

function removePromotionMetadata(metadata: Json): Json {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {}
  }

  const next = {
    ...(metadata as Record<string, Json | undefined>),
  }

  delete next.promoted_requirement_id
  delete next.promoted_at

  return next as Json
}

export async function listRequirementsForProduct(
  productId: string
): Promise<Result<RequirementWithFoundCount[]>> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { data: requirementsData, error: requirementsError } = await supabase
      .from("requirements")
      .select("*")
      .eq("product_id", productId)
      .neq("status", "archived")
      .order("created_at", { ascending: true })

    if (requirementsError) {
      return {
        data: null,
        error: requirementsError.message,
      }
    }

    const requirements = (requirementsData as RequirementRecord[] | null) ?? []
    if (!requirements.length) {
      return {
        data: [],
        error: null,
      }
    }

    const requirementIds = requirements.map((requirement) => requirement.id)

    const { data: linksData, error: linksError } = await supabase
      .from("requirement_suppliers")
      .select("requirement_id, match_status")
      .in("requirement_id", requirementIds)
      .in("match_status", ["candidate", "shortlisted"])

    if (linksError) {
      return {
        data: null,
        error: linksError.message,
      }
    }

    const links = (linksData as RequirementSupplierLinkRecord[] | null) ?? []

    const foundCountByRequirementId = new Map<string, number>()
    for (const link of links) {
      foundCountByRequirementId.set(
        link.requirement_id,
        (foundCountByRequirementId.get(link.requirement_id) ?? 0) + 1
      )
    }

    const data: RequirementWithFoundCount[] = requirements.map((requirement) => ({
      ...requirement,
      amountFound: foundCountByRequirementId.get(requirement.id) ?? 0,
    }))

    return {
      data,
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Unable to load requirements.",
    }
  }
}

export async function listSuppliersForRequirement(
  requirementId: string
): Promise<Result<RequirementSupplierSummary[]>> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { data: linksData, error: linksError } = await supabase
      .from("requirement_suppliers")
      .select(
        "id, supplier_id, fit_score, match_status, outreach_state"
      )
      .eq("requirement_id", requirementId)

    if (linksError) {
      return {
        data: null,
        error: linksError.message,
      }
    }

    const links =
      (linksData as
        | Pick<
            Database["public"]["Tables"]["requirement_suppliers"]["Row"],
            "id" | "supplier_id" | "fit_score" | "match_status" | "outreach_state"
          >[]
        | null) ?? []

    if (!links.length) {
      return {
        data: [],
        error: null,
      }
    }

    const supplierIds = Array.from(new Set(links.map((link) => link.supplier_id)))
    const { data: suppliersData, error: suppliersError } = await supabase
      .from("suppliers")
      .select("id, name, website, contact_url, region, products")
      .in("id", supplierIds)

    if (suppliersError) {
      return {
        data: null,
        error: suppliersError.message,
      }
    }

    const suppliers =
      (suppliersData as
        | Pick<
            Database["public"]["Tables"]["suppliers"]["Row"],
            "id" | "name" | "website" | "contact_url" | "region" | "products"
          >[]
        | null) ?? []

    const supplierById = new Map(
      suppliers.map((supplier) => [supplier.id, supplier])
    )

    const data = links
      .map((link) => {
        const supplier = supplierById.get(link.supplier_id)
        if (!supplier) return null
        return {
          linkId: link.id,
          supplierId: supplier.id,
          supplierName: supplier.name,
          website: supplier.website,
          contactUrl: supplier.contact_url,
          region: supplier.region,
          products: supplier.products ?? [],
          fitScore: link.fit_score,
          matchStatus: link.match_status,
          outreachState: (link.outreach_state ??
            "pending") as RequirementSupplierSummary["outreachState"],
        } satisfies RequirementSupplierSummary
      })
      .filter(
        (row): row is RequirementSupplierSummary => Boolean(row)
      )
      .sort((left, right) => {
        const fitDiff = (right.fitScore ?? -1) - (left.fitScore ?? -1)
        if (fitDiff !== 0) return fitDiff
        return left.supplierName.localeCompare(right.supplierName)
      })

    return {
      data,
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Unable to load suppliers for requirement.",
    }
  }
}

export async function promoteRequirementCandidate(
  candidateId: string
): Promise<Result<RequirementRecord>> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { data: candidateData, error: candidateError } = await supabase
      .from("requirement_candidates")
      .select("*")
      .eq("id", candidateId)
      .maybeSingle()

    if (candidateError) {
      return {
        data: null,
        error: candidateError.message,
      }
    }

    const candidate = candidateData as RequirementCandidateRecord | null
    if (!candidate) {
      return {
        data: null,
        error: "Candidate not found.",
      }
    }

    const existingMetadata = parseMetadata(candidate.metadata)
    if (candidate.status === "accepted" && existingMetadata.promoted_requirement_id) {
      const { data: existingRequirement, error: existingRequirementError } =
        await supabase
          .from("requirements")
          .select("*")
          .eq("id", existingMetadata.promoted_requirement_id)
          .maybeSingle()

      if (existingRequirementError) {
        return {
          data: null,
          error: existingRequirementError.message,
        }
      }

      return {
        data: (existingRequirement as RequirementRecord | null) ?? null,
        error: existingRequirement ? null : "Requirement already promoted.",
      }
    }

    const { data: insertedRequirementData, error: insertError } = await supabase
      .from("requirements")
      .insert({
        product_id: candidate.product_id,
        title: candidate.title,
        description: candidate.description,
        category: candidate.category,
        status: "ready",
      })
      .select("*")
      .single()

    const insertedRequirement =
      (insertedRequirementData as RequirementRecord | null) ?? null

    if (insertError || !insertedRequirement) {
      return {
        data: null,
        error: insertError?.message ?? "Unable to create requirement.",
      }
    }

    const nextMetadata: Json =
      candidate.metadata && typeof candidate.metadata === "object"
        ? ({
            ...(candidate.metadata as Record<string, Json | undefined>),
            promoted_requirement_id: insertedRequirement.id,
            promoted_at: new Date().toISOString(),
          } as Json)
        : ({
            promoted_requirement_id: insertedRequirement.id,
            promoted_at: new Date().toISOString(),
          } as Json)

    const { error: updateError } = await supabase
      .from("requirement_candidates")
      .update({
        status: "accepted",
        metadata: nextMetadata,
      })
      .eq("id", candidate.id)

    if (updateError) {
      return {
        data: null,
        error: updateError.message,
      }
    }

    return {
      data: insertedRequirement,
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Unable to promote requirement candidate.",
    }
  }
}

export async function updateRequirementStatus(
  requirementId: string,
  status: UserSettableRequirementStatus
): Promise<{ error: string | null }> {
  if (!supabase) {
    return {
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { error } = await supabase
      .from("requirements")
      .update({ status })
      .eq("id", requirementId)

    return {
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to update requirement status.",
    }
  }
}

export async function archiveRequirement(
  requirementId: string
): Promise<{ error: string | null }> {
  if (!supabase) {
    return {
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { error } = await supabase
      .from("requirements")
      .update({ status: "archived" })
      .eq("id", requirementId)

    return {
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to archive requirement.",
    }
  }
}

export async function bulkUpdateRequirementStatus(
  requirementIds: string[],
  status: UserSettableRequirementStatus
): Promise<{ error: string | null }> {
  if (!requirementIds.length) {
    return { error: null }
  }

  if (!supabase) {
    return {
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { error } = await supabase
      .from("requirements")
      .update({ status })
      .in("id", requirementIds)

    return {
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to bulk update requirement status.",
    }
  }
}

export async function bulkArchiveRequirements(
  requirementIds: string[]
): Promise<{ error: string | null }> {
  if (!requirementIds.length) {
    return { error: null }
  }

  if (!supabase) {
    return {
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { error } = await supabase
      .from("requirements")
      .update({ status: "archived" })
      .in("id", requirementIds)

    return {
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to bulk archive requirements.",
    }
  }
}

export async function deleteRequirement(
  requirementId: string
): Promise<{ error: string | null }> {
  if (!supabase) {
    return {
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { error } = await supabase
      .from("requirements")
      .delete()
      .eq("id", requirementId)

    return {
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to delete requirement.",
    }
  }
}

export async function bulkDeleteRequirements(
  requirementIds: string[]
): Promise<{ error: string | null }> {
  if (!requirementIds.length) {
    return { error: null }
  }

  if (!supabase) {
    return {
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { error } = await supabase
      .from("requirements")
      .delete()
      .in("id", requirementIds)

    return {
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to bulk delete requirements.",
    }
  }
}

export async function unpromoteRequirementCandidate(
  candidateId: string
): Promise<{ error: string | null }> {
  if (!supabase) {
    return {
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { data: candidateData, error: candidateError } = await supabase
      .from("requirement_candidates")
      .select("*")
      .eq("id", candidateId)
      .maybeSingle()

    if (candidateError) {
      return {
        error: candidateError.message,
      }
    }

    const candidate = candidateData as RequirementCandidateRecord | null
    if (!candidate) {
      return {
        error: "Candidate not found.",
      }
    }

    const metadata = parseMetadata(candidate.metadata)
    if (metadata.promoted_requirement_id) {
      const { error: deleteRequirementError } = await supabase
        .from("requirements")
        .delete()
        .eq("id", metadata.promoted_requirement_id)

      if (deleteRequirementError) {
        return {
          error: deleteRequirementError.message,
        }
      }
    }

    const { error: updateCandidateError } = await supabase
      .from("requirement_candidates")
      .update({
        status: "proposed",
        metadata: removePromotionMetadata(candidate.metadata),
      })
      .eq("id", candidate.id)

    if (updateCandidateError) {
      return {
        error: updateCandidateError.message,
      }
    }

    return {
      error: null,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to unpromote requirement candidate.",
    }
  }
}

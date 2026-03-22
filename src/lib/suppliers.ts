import type { Database } from "@/lib/database.types"
import { supabase } from "@/lib/supabase"

type Result<T> = {
  data: T | null
  error: string | null
}

type RequirementRow = Pick<
  Database["public"]["Tables"]["requirements"]["Row"],
  "id" | "title"
>

type RequirementSupplierRow = {
  id: string
  requirement_id: string
  supplier_id: string
  fit_score: number | null
  match_status: RequirementMatchStatus
  outreach_state: SupplierOutreachState
  outreach_last_error: string | null
}

type SupplierRow = Pick<
  Database["public"]["Tables"]["suppliers"]["Row"],
  | "id"
  | "name"
  | "website"
  | "contact_url"
  | "email"
  | "phone"
  | "country"
  | "region"
  | "products"
  | "notes"
>

export type RequirementMatchStatus =
  Database["public"]["Enums"]["requirement_match_status"]

export type SupplierOutreachState =
  | "pending"
  | "ready"
  | "contacting"
  | "contacted"
  | "failed"

export type SupplierMatchForRequirement = {
  linkId: string
  requirementId: string
  requirementTitle: string
  supplierId: string
  supplierName: string
  region: string | null
  products: string[]
  website: string | null
  contactUrl: string | null
  email: string | null
  phone: string | null
  country: string | null
  notes: string | null
  fitScore: number | null
  matchStatus: RequirementMatchStatus
  outreachState: SupplierOutreachState
  outreachLastError: string | null
}

export async function listSupplierMatchesForProduct(
  productId: string
): Promise<Result<SupplierMatchForRequirement[]>> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { data: requirementsData, error: requirementsError } = await supabase
      .from("requirements")
      .select("id, title")
      .eq("product_id", productId)
      .neq("status", "archived")
      .order("created_at", { ascending: true })

    if (requirementsError) {
      return {
        data: null,
        error: requirementsError.message,
      }
    }

    const requirements = (requirementsData as RequirementRow[] | null) ?? []
    if (!requirements.length) {
      return {
        data: [],
        error: null,
      }
    }

    const requirementIds = requirements.map((requirement) => requirement.id)

    const { data: linksData, error: linksError } = await supabase
      .from("requirement_suppliers")
      .select(
        "id, requirement_id, supplier_id, fit_score, match_status, outreach_state, outreach_last_error"
      )
      .in("requirement_id", requirementIds)

    if (linksError) {
      return {
        data: null,
        error: linksError.message,
      }
    }

    const links = (linksData as RequirementSupplierRow[] | null) ?? []
    if (!links.length) {
      return {
        data: [],
        error: null,
      }
    }

    const supplierIds = Array.from(new Set(links.map((link) => link.supplier_id)))
    const { data: suppliersData, error: suppliersError } = await supabase
      .from("suppliers")
      .select(
        "id, name, website, contact_url, email, phone, country, region, products, notes"
      )
      .in("id", supplierIds)

    if (suppliersError) {
      return {
        data: null,
        error: suppliersError.message,
      }
    }

    const suppliers = (suppliersData as SupplierRow[] | null) ?? []
    const requirementTitleById = new Map(
      requirements.map((requirement) => [requirement.id, requirement.title])
    )
    const supplierById = new Map(
      suppliers.map((supplier) => [supplier.id, supplier])
    )

    const rows = links
      .map((link) => {
        const supplier = supplierById.get(link.supplier_id)
        const requirementTitle = requirementTitleById.get(link.requirement_id)
        if (!supplier || !requirementTitle) {
          return null
        }

        return {
          linkId: link.id,
          requirementId: link.requirement_id,
          requirementTitle,
          supplierId: supplier.id,
          supplierName: supplier.name,
          region: supplier.region,
          products: supplier.products ?? [],
          website: supplier.website,
          contactUrl: supplier.contact_url,
          email: supplier.email,
          phone: supplier.phone,
          country: supplier.country,
          notes: supplier.notes,
          fitScore: link.fit_score,
          matchStatus: link.match_status,
          outreachState: link.outreach_state,
          outreachLastError: link.outreach_last_error,
        } satisfies SupplierMatchForRequirement
      })
      .filter((row): row is SupplierMatchForRequirement => Boolean(row))
      .sort((left, right) => {
        const requirementDiff = left.requirementTitle.localeCompare(
          right.requirementTitle
        )
        if (requirementDiff !== 0) {
          return requirementDiff
        }

        const leftFit = left.fitScore ?? -1
        const rightFit = right.fitScore ?? -1
        if (rightFit !== leftFit) {
          return rightFit - leftFit
        }

        return left.supplierName.localeCompare(right.supplierName)
      })

    return {
      data: rows,
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Unable to load suppliers.",
    }
  }
}

export async function updateSupplierMatchStatus(
  linkId: string,
  matchStatus: RequirementMatchStatus
): Promise<{ error: string | null }> {
  if (!supabase) {
    return {
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { error } = await supabase
      .from("requirement_suppliers")
      .update({ match_status: matchStatus })
      .eq("id", linkId)

    return {
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to update supplier match status.",
    }
  }
}

export async function bulkUpdateSupplierMatchStatus(
  linkIds: string[],
  matchStatus: RequirementMatchStatus
): Promise<{ error: string | null }> {
  if (!linkIds.length) {
    return { error: null }
  }

  if (!supabase) {
    return {
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { error } = await supabase
      .from("requirement_suppliers")
      .update({ match_status: matchStatus })
      .in("id", linkIds)

    return {
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to update supplier match statuses.",
    }
  }
}

export async function deleteSupplierMatch(
  linkId: string
): Promise<{ error: string | null }> {
  if (!supabase) {
    return {
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { error } = await supabase
      .from("requirement_suppliers")
      .delete()
      .eq("id", linkId)

    return {
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to delete supplier match row.",
    }
  }
}

export async function bulkDeleteSupplierMatches(
  linkIds: string[]
): Promise<{ error: string | null }> {
  if (!linkIds.length) {
    return { error: null }
  }

  if (!supabase) {
    return {
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { error } = await supabase
      .from("requirement_suppliers")
      .delete()
      .in("id", linkIds)

    return {
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to delete supplier match rows.",
    }
  }
}

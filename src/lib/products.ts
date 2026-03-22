import type { Database } from "@/lib/database.types"
import { withTimeout } from "@/lib/async"
import { supabase } from "@/lib/supabase"

export type ProductRecord = Database["public"]["Tables"]["products"]["Row"]

export type CreateProductInput = {
  name: string
  category?: string
  description?: string
}

type Result<T> = {
  data: T | null
  error: string | null
}

export async function listProductsForCurrentUser(): Promise<
  Result<ProductRecord[]>
> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { data, error } = await withTimeout(
      Promise.resolve(
        supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: true })
      ),
      5000,
      "Timed out while loading products."
    )

    return {
      data: (data as ProductRecord[] | null) ?? [],
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unable to load products.",
    }
  }
}

export async function createProductForCurrentUser({
  name,
  category,
  description,
}: CreateProductInput): Promise<Result<ProductRecord>> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { data, error } = await withTimeout(
      Promise.resolve(
        supabase
          .from("products")
          .insert({
            name,
            category: category || null,
            description: description || null,
          })
          .select("*")
          .single()
      ),
      8000,
      "Timed out while creating the product."
    )

    return {
      data: (data as ProductRecord | null) ?? null,
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Unable to create the product.",
    }
  }
}

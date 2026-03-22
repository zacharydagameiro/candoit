import type { Database } from "@/lib/database.types"
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

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true })

  return {
    data: (data as ProductRecord[] | null) ?? [],
    error: error?.message ?? null,
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

  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      category: category || null,
      description: description || null,
    })
    .select("*")
    .single()

  return {
    data: (data as ProductRecord | null) ?? null,
    error: error?.message ?? null,
  }
}

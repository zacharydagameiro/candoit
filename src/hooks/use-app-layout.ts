import { useOutletContext } from "react-router-dom"

import type { ProductRecord } from "@/lib/products"

export type AppLayoutContext = {
  currentProduct: ProductRecord
}

export function useAppLayout() {
  return useOutletContext<AppLayoutContext>()
}

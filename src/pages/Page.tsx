import { useEffect, useState } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"

import { AppSidebar } from "@/components/app-sidebar"
import { EmptyProductsState } from "@/components/empty-products-state"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { AppLayoutContext } from "@/hooks/use-app-layout"
import { getRouteMeta } from "@/lib/app-shell"
import {
  createProductForCurrentUser,
  listProductsForCurrentUser,
  type ProductRecord,
} from "@/lib/products"
import { useAuth } from "@/providers/auth-provider"

export default function Page() {
  const { pathname } = useLocation()
  const routeMeta = getRouteMeta(pathname)
  const { profile, signOut, user } = useAuth()
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [currentProductId, setCurrentProductId] = useState<string | null>(null)
  const [isProductsLoading, setIsProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [isCreatingProduct, setIsCreatingProduct] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadProducts() {
      setIsProductsLoading(true)
      const { data, error } = await listProductsForCurrentUser()

      if (!isMounted) {
        return
      }

      if (error) {
        setProducts([])
        setCurrentProductId(null)
        setProductsError(error)
        setIsProductsLoading(false)
        return
      }

      const nextProducts = data ?? []

      setProducts(nextProducts)
      setProductsError(null)
      setCurrentProductId((currentId) => {
        if (currentId && nextProducts.some((product) => product.id === currentId)) {
          return currentId
        }

        return nextProducts[0]?.id ?? null
      })
      setIsProductsLoading(false)
    }

    void loadProducts()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  const currentProduct = currentProductId
    ? products.find((product) => product.id === currentProductId) ?? null
    : null

  const sidebarUser = {
    name:
      profile?.display_name ||
      user?.user_metadata.display_name ||
      user?.email?.split("@")[0] ||
      "Workspace User",
    email: user?.email ?? "",
    avatar: profile?.avatar_url ?? "",
  }

  const outletContext: AppLayoutContext | null = currentProduct
    ? {
        currentProduct,
      }
    : null

  async function handleCreateProduct(input: {
    name: string
    category?: string
    description?: string
  }) {
    setProductsError(null)
    setIsCreatingProduct(true)

    const { data, error } = await createProductForCurrentUser(input)

    setIsCreatingProduct(false)

    if (error) {
      setProductsError(error)
      return
    }

    if (!data) {
      setProductsError("Product creation returned no record.")
      return
    }

    setProducts((currentProducts) => [...currentProducts, data])
    setCurrentProductId(data.id)
  }

  async function handleSignOut() {
    await signOut()
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          products={products}
          currentProductId={currentProductId}
          onProductChange={setCurrentProductId}
          onSignOut={handleSignOut}
          user={sidebarUser}
        />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b">
            <div className="flex min-w-0 items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  {routeMeta.section ? (
                    <>
                      <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink asChild>
                          <Link to={routeMeta.sectionHref ?? "/dashboard"}>
                            {routeMeta.section}
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                    </>
                  ) : null}
                  <BreadcrumbItem>
                    <BreadcrumbPage>{routeMeta.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto hidden px-4 text-right md:block">
              <p className="text-sm font-medium">
                {currentProduct?.name ?? "No active product"}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentProduct?.category ?? "Create a product to begin."}
              </p>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {isProductsLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="rounded-2xl border bg-card px-6 py-4 text-sm text-muted-foreground shadow-sm">
                  Loading products...
                </div>
              </div>
            ) : currentProduct && outletContext ? (
              <Outlet context={outletContext} />
            ) : (
              <EmptyProductsState
                isSubmitting={isCreatingProduct}
                error={productsError}
                onCreateProduct={handleCreateProduct}
              />
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

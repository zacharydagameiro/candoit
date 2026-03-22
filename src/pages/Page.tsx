import { useEffect, useState } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { PlusIcon } from "lucide-react"

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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
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
  const [isCreateProductSheetOpen, setIsCreateProductSheetOpen] = useState(false)
  const [headerProductName, setHeaderProductName] = useState("")
  const [headerProductCategory, setHeaderProductCategory] = useState("")
  const [headerProductDescription, setHeaderProductDescription] = useState("")
  const [headerCreateError, setHeaderCreateError] = useState<string | null>(null)

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

  async function handleHeaderCreateProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setHeaderCreateError(null)
    setIsCreatingProduct(true)

    const { data, error } = await createProductForCurrentUser({
      name: headerProductName,
      category: headerProductCategory,
      description: headerProductDescription,
    })

    setIsCreatingProduct(false)

    if (error) {
      setHeaderCreateError(error)
      return
    }

    if (!data) {
      setHeaderCreateError("Product creation returned no record.")
      return
    }

    setProducts((currentProducts) => [...currentProducts, data])
    setCurrentProductId(data.id)
    setIsCreateProductSheetOpen(false)
    setHeaderProductName("")
    setHeaderProductCategory("")
    setHeaderProductDescription("")
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
            <div className="ml-auto flex items-center gap-3 px-4">
              <div className="hidden text-right md:block">
                <p className="text-sm font-medium">
                  {currentProduct?.name ?? "No active product"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentProduct?.category ?? "Create a product to begin."}
                </p>
              </div>
              <Sheet
                open={isCreateProductSheetOpen}
                onOpenChange={setIsCreateProductSheetOpen}
              >
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent"
                    onClick={() => {
                      setHeaderCreateError(null)
                    }}
                  >
                    <PlusIcon className="size-4" />
                    New Product
                  </button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Create Product</SheetTitle>
                    <SheetDescription>
                      Add a new product and switch the workspace to it.
                    </SheetDescription>
                  </SheetHeader>
                  <form
                    className="flex flex-1 flex-col gap-4 px-4 pb-4"
                    onSubmit={handleHeaderCreateProduct}
                  >
                    {headerCreateError ? (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        {headerCreateError}
                      </div>
                    ) : null}

                    <label className="grid gap-2 text-sm font-medium">
                      Product name
                      <input
                        value={headerProductName}
                        onChange={(event) => setHeaderProductName(event.target.value)}
                        placeholder="Prime Drink"
                        required
                        className="h-10 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-medium">
                      Category
                      <input
                        value={headerProductCategory}
                        onChange={(event) =>
                          setHeaderProductCategory(event.target.value)
                        }
                        placeholder="Energy Drink"
                        className="h-10 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-medium">
                      Description
                      <textarea
                        value={headerProductDescription}
                        onChange={(event) =>
                          setHeaderProductDescription(event.target.value)
                        }
                        placeholder="High-level product brief and sourcing goals."
                        className="min-h-28 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={isCreatingProduct}
                      className="mt-auto inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
                    >
                      {isCreatingProduct ? "Creating product..." : "Create Product"}
                    </button>
                  </form>
                </SheetContent>
              </Sheet>
            </div>
          </header>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
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

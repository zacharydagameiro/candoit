"use client"

import {
  CheckIcon,
  ChevronsUpDownIcon,
  FlaskConicalIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import type { ProductRecord } from "@/lib/products"
import { cn } from "@/lib/utils"

type ProductSwitcherProps = {
  products: ProductRecord[]
  currentProductId: string | null
  onProductChange: (productId: string) => void
}

export function ProductSwitcher({
  products,
  currentProductId,
  onProductChange,
}: ProductSwitcherProps) {
  const { isMobile } = useSidebar()
  const currentProduct = currentProductId
    ? products.find((product) => product.id === currentProductId) ?? null
    : null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <FlaskConicalIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {currentProduct?.name ?? "No product yet"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {currentProduct?.category ?? "Create your first product to begin."}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-64 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={8}
          >
            <DropdownMenuLabel>Active Product</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {products.length ? (
              products.map((product) => (
                <DropdownMenuItem
                  key={product.id}
                  onSelect={() => onProductChange(product.id)}
                >
                  <div className="grid flex-1">
                    <span className="font-medium">{product.name}</span>
                    {product.category ? (
                      <span className="text-xs text-muted-foreground">
                        {product.category}
                      </span>
                    ) : null}
                  </div>
                  <CheckIcon
                    className={cn(
                      "ml-auto size-4",
                      product.id === currentProductId ? "opacity-100" : "opacity-0"
                    )}
                  />
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>
                Create your first product from the main panel.
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

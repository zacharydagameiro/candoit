"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { ProductSwitcher } from "@/components/product-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { chatNavItems, workspaceNavItems } from "@/lib/app-shell"
import type { ProductRecord } from "@/lib/products"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  products: ProductRecord[]
  currentProductId: string | null
  onProductChange: (productId: string) => void
  onSignOut: () => Promise<void>
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function AppSidebar({
  products,
  currentProductId,
  onProductChange,
  onSignOut,
  user,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <ProductSwitcher
          products={products}
          currentProductId={currentProductId}
          onProductChange={onProductChange}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={workspaceNavItems} label="Workspace" />
        <NavMain items={chatNavItems} label="Chats" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onSignOut={onSignOut} />
      </SidebarFooter>
    </Sidebar>
  )
}

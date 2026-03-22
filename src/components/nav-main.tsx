import * as React from "react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import type { AppNavItem } from "@/lib/app-shell"
import { ChevronRightIcon } from "lucide-react"

export function NavMain({
  items,
}: {
  items: AppNavItem[]
}) {
  const { pathname } = useLocation()
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      items
        .filter((item) => item.items?.length)
        .map((item) => [
          item.title,
          item.items?.some((subItem) => subItem.to === pathname) ?? false,
        ])
    )
  )

  React.useEffect(() => {
    setOpenItems((currentState) => {
      let hasChanged = false
      const nextState = { ...currentState }

      for (const item of items) {
        const shouldBeOpen = item.items?.some((subItem) => subItem.to === pathname)

        if (shouldBeOpen && !currentState[item.title]) {
          nextState[item.title] = true
          hasChanged = true
        }
      }

      return hasChanged ? nextState : currentState
    })
  }, [items, pathname])

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon
          const hasChildren = Boolean(item.items?.length)
          const isItemActive =
            pathname === item.to ||
            item.items?.some((subItem) => subItem.to === pathname)

          if (!hasChildren) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isItemActive}
                  tooltip={item.title}
                >
                  <NavLink to={item.to}>
                    <Icon />
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              open={openItems[item.title] ?? false}
              onOpenChange={(open) =>
                setOpenItems((currentState) => ({
                  ...currentState,
                  [item.title]: open,
                }))
              }
            >
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isItemActive}
                  tooltip={item.title}
                >
                  <NavLink to={item.to}>
                    <Icon />
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction className="data-[state=open]:rotate-90">
                    <ChevronRightIcon />
                    <span className="sr-only">Toggle</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === subItem.to}
                        >
                          <NavLink to={subItem.to}>
                            <span>{subItem.title}</span>
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

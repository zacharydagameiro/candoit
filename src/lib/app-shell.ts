import type { LucideIcon } from "lucide-react"
import {
  BoxesIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  MessageSquareMoreIcon,
} from "lucide-react"

export type ProductOption = {
  id: string
  name: string
  category?: string
}

export type AppNavChild = {
  title: string
  to: string
}

export type AppNavItem = {
  title: string
  to: string
  icon: LucideIcon
  items?: AppNavChild[]
}

export type RouteMeta = {
  section?: string
  sectionHref?: string
  title: string
}

export type SupplierStage = "directory" | "contacting" | "awaiting-response"

export const appNavItems: AppNavItem[] = [
  {
    title: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Requirements",
    to: "/requirements",
    icon: ListChecksIcon,
  },
  {
    title: "Chats",
    to: "/chats/discovery",
    icon: MessageSquareMoreIcon,
    items: [
      {
        title: "Discovery",
        to: "/chats/discovery",
      },
      {
        title: "Outreach",
        to: "/chats/outreach",
      },
      {
        title: "Negotiation",
        to: "/chats/negotiation",
      },
    ],
  },
  {
    title: "Suppliers",
    to: "/suppliers/directory",
    icon: BoxesIcon,
    items: [
      {
        title: "Directory",
        to: "/suppliers/directory",
      },
      {
        title: "Contacting",
        to: "/suppliers/contacting",
      },
      {
        title: "Awaiting Response",
        to: "/suppliers/awaiting-response",
      },
    ],
  },
]

export function getRouteMeta(pathname: string): RouteMeta {
  for (const item of appNavItems) {
    if (item.to === pathname && !item.items?.length) {
      return {
        title: item.title,
      }
    }

    const child = item.items?.find((subItem) => subItem.to === pathname)
    if (child) {
      return {
        section: item.title,
        sectionHref: item.to,
        title: child.title,
      }
    }
  }

  return {
    title: "Dashboard",
  }
}

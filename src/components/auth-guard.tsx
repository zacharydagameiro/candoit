import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/providers/auth-provider"

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-6">
      <div className="rounded-2xl border bg-card px-6 py-4 text-sm text-muted-foreground shadow-sm">
        Loading workspace...
      </div>
    </div>
  )
}

export function ProtectedRoute() {
  const { isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function GuestOnlyRoute() {
  const { isLoading, user } = useAuth()

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import type { Session, User } from "@supabase/supabase-js"

import {
  getCurrentSession,
  getProfile,
  onAuthStateChange,
  signInWithPassword,
  signOutUser,
  signUpWithPassword,
  type ProfileRecord,
  type SignInInput,
  type SignUpInput,
} from "@/lib/auth"
import { isSupabaseConfigured } from "@/lib/supabase"

type AuthContextValue = {
  user: User | null
  session: Session | null
  profile: ProfileRecord | null
  isLoading: boolean
  isConfigured: boolean
  signIn: (input: SignInInput) => Promise<{ error: string | null }>
  signUp: (input: SignUpInput) => Promise<{ error: string | null }>
  signOut: () => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [user, setUser] = React.useState<User | null>(null)
  const [profile, setProfile] = React.useState<ProfileRecord | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const loadProfile = React.useCallback(async (userId: string) => {
    const { data } = await getProfile(userId)
    setProfile(data)
  }, [])

  React.useEffect(() => {
    let isMounted = true

    async function initializeAuth() {
      if (!isSupabaseConfigured) {
        if (isMounted) {
          setIsLoading(false)
        }
        return
      }

      try {
        const { data } = await getCurrentSession()

        if (!isMounted) {
          return
        }

        setSession(data)
        setUser(data?.user ?? null)

        if (data?.user) {
          await loadProfile(data.user.id)
        } else {
          setProfile(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void initializeAuth()

    const subscription = onAuthStateChange(async (_event, nextSession) => {
      try {
        if (!isMounted) {
          return
        }

        setSession(nextSession)
        setUser(nextSession?.user ?? null)

        if (nextSession?.user) {
          await loadProfile(nextSession.user.id)
        } else {
          setProfile(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [loadProfile])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      isLoading,
      isConfigured: isSupabaseConfigured,
      signIn: async (input) => {
        const { error } = await signInWithPassword(input)
        return { error }
      },
      signUp: async (input) => {
        const { error } = await signUpWithPassword(input)
        return { error }
      },
      signOut: async () => {
        const { error } = await signOutUser()
        return { error }
      },
      refreshProfile: async () => {
        if (!user) {
          setProfile(null)
          return
        }

        await loadProfile(user.id)
      },
    }),
    [isLoading, loadProfile, profile, session, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.")
  }

  return context
}

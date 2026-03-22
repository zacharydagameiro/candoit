import type {
  AuthChangeEvent,
  Session,
  Subscription,
  User,
} from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"
import { withTimeout } from "@/lib/async"
import { supabase } from "@/lib/supabase"

export type ProfileRecord = Database["public"]["Tables"]["profiles"]["Row"]

export type SignInInput = {
  email: string
  password: string
}

export type SignUpInput = {
  email: string
  password: string
  displayName: string
}

type Result<T> = {
  data: T | null
  error: string | null
}

export async function getCurrentSession(): Promise<Result<Session>> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { data, error } = await supabase.auth.getSession()

    return {
      data: data.session,
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unable to load session.",
    }
  }
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): Subscription | null {
  if (!supabase) {
    return null
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback)

  return subscription
}

export async function signInWithPassword({
  email,
  password,
}: SignInInput): Promise<Result<User>> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({
        email,
        password,
      }),
      8000,
      "Timed out while signing in."
    )

    return {
      data: data.user,
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unable to sign in.",
    }
  }
}

export async function signUpWithPassword({
  email,
  password,
  displayName,
}: SignUpInput): Promise<Result<User>> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      }),
      8000,
      "Timed out while creating the account."
    )

    return {
      data: data.user,
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Unable to create the account.",
    }
  }
}

export async function signOutUser(): Promise<{ error: string | null }> {
  if (!supabase) {
    return {
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { error } = await withTimeout(
      supabase.auth.signOut(),
      5000,
      "Timed out while signing out."
    )

    return {
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to sign out.",
    }
  }
}

export async function getProfile(userId: string): Promise<Result<ProfileRecord>> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase environment variables are missing.",
    }
  }

  try {
    const { data, error } = await withTimeout(
      Promise.resolve(
        supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle()
      ),
      5000,
      "Timed out while loading the user profile."
    )

    return {
      data: (data as ProfileRecord | null) ?? null,
      error: error?.message ?? null,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unable to load profile.",
    }
  }
}

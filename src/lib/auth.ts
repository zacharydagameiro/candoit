import type {
  AuthChangeEvent,
  Session,
  Subscription,
  User,
} from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"
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

  const { data, error } = await supabase.auth.getSession()

  return {
    data: data.session,
    error: error?.message ?? null,
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return {
    data: data.user,
    error: error?.message ?? null,
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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  })

  return {
    data: data.user,
    error: error?.message ?? null,
  }
}

export async function signOutUser(): Promise<{ error: string | null }> {
  if (!supabase) {
    return {
      error: "Supabase environment variables are missing.",
    }
  }

  const { error } = await supabase.auth.signOut()

  return {
    error: error?.message ?? null,
  }
}

export async function getProfile(userId: string): Promise<Result<ProfileRecord>> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase environment variables are missing.",
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  return {
    data: (data as ProfileRecord | null) ?? null,
    error: error?.message ?? null,
  }
}

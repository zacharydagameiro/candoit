import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/providers/auth-provider"

type LocationState = {
  from?: {
    pathname?: string
  }
}

export function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isConfigured, signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const redirectPath =
    (location.state as LocationState | null)?.from?.pathname ?? "/dashboard"

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const { error: signInError } = await signIn({
      email,
      password,
    })

    setIsSubmitting(false)

    if (signInError) {
      setError(signInError)
      return
    }

    navigate(redirectPath, { replace: true })
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Login to your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and password to access your sourcing workspace.
        </p>
      </div>

      {!isConfigured ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Add `VITE_SUPABASE_URL` and
          `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` to your environment before
          testing auth.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3">
        <label className="grid gap-2 text-sm font-medium">
          Email
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="m@example.com"
            autoComplete="email"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Password
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </label>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || !isConfigured}>
        {isSubmitting ? "Logging in..." : "Login"}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link to="/signup" className="font-medium text-foreground underline underline-offset-4">
          Sign up
        </Link>
      </div>
    </form>
  )
}

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/providers/auth-provider"

export function SignupForm() {
  const navigate = useNavigate()
  const { isConfigured, signUp } = useAuth()
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const { error: signUpError } = await signUp({
      displayName,
      email,
      password,
    })

    setIsSubmitting(false)

    if (signUpError) {
      setError(signUpError)
      return
    }

    navigate("/dashboard", { replace: true })
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Set up your workspace to start mapping requirements and suppliers.
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
          Full name
          <Input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Zachary Gameiro"
            autoComplete="name"
            required
          />
        </label>
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
            placeholder="Create a password"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || !isConfigured}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
          Login
        </Link>
      </div>
    </form>
  )
}

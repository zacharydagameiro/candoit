import { LoginForm } from "@/components/login-form"
import { AuthPageShell } from "@/components/auth-page-shell"

export default function LoginPage() {
  return (
    <AuthPageShell title="CanDoIt">
      <LoginForm />
    </AuthPageShell>
  )
}

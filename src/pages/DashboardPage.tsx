import { useAppLayout } from "@/hooks/use-app-layout"

export default function DashboardPage() {
  const { currentProduct } = useAppLayout()

  return (
    <div className="flex flex-1 flex-col gap-4">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {currentProduct.name}
          {currentProduct.category ? ` · ${currentProduct.category}` : ""}
        </p>
      </section>
    </div>
  )
}

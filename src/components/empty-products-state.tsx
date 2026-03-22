import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type EmptyProductsStateProps = {
  isSubmitting: boolean
  error: string | null
  onCreateProduct: (input: {
    name: string
    category?: string
    description?: string
  }) => Promise<void>
}

export function EmptyProductsState({
  isSubmitting,
  error,
  onCreateProduct,
}: EmptyProductsStateProps) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onCreateProduct({
      name,
      category,
      description,
    })
  }

  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-2xl rounded-2xl border bg-card p-6 shadow-sm md:p-8">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Product Setup</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create your first product
          </h1>
          <p className="text-sm text-muted-foreground">
            Products belong to the signed-in user. This first record becomes the
            active product for the sourcing workspace.
          </p>
        </div>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <label className="grid gap-2 text-sm font-medium">
            Product name
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="VoltRush Energy"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Category
            <Input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Zero-sugar energy drink"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="High-level product brief, packaging direction, and supplier goals."
              className="min-h-28 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>

          <Button type="submit" className="w-full sm:w-fit" disabled={isSubmitting}>
            {isSubmitting ? "Creating product..." : "Create Product"}
          </Button>
        </form>
      </div>
    </div>
  )
}

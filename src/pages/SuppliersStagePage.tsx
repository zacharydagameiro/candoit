import { useAppLayout } from "@/hooks/use-app-layout"
import type { SupplierStage } from "@/lib/app-shell"

const stageTitles: Record<SupplierStage, string> = {
  directory: "Supplier Directory",
  contacting: "Contacting Suppliers",
  "awaiting-response": "Awaiting Responses",
}

type SuppliersStagePageProps = {
  stage: SupplierStage
}

export default function SuppliersStagePage({
  stage,
}: SuppliersStagePageProps) {
  const { currentProduct } = useAppLayout()
  const stageTitle = stageTitles[stage]

  return (
    <div className="flex flex-1 flex-col gap-4">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">{stageTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {currentProduct.name}
        </p>
      </section>
    </div>
  )
}

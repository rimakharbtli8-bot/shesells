import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { OBJECTIONS, OBJECTION_CATEGORIES } from "@/lib/data/objections";

export const metadata = { title: "Einwand-Bibliothek — CLOSER" };

export default function ObjectionLibraryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Einwand-Bibliothek</h1>
        <p className="mt-1 text-sm text-ink-muted">Nicht auswendig lernen. Verstehen.</p>
      </div>

      {OBJECTION_CATEGORIES.map((category) => {
        const items = OBJECTIONS.filter((o) => o.category === category.id);
        return (
          <div key={category.id}>
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink">
              <span>{category.icon}</span>
              {category.label}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((objection) => (
                <Link key={objection.id} href={`/einwaende/${objection.slug}`}>
                  <Card className="flex items-center justify-between gap-3 transition-shadow hover:shadow-card">
                    <span className="text-sm font-medium text-ink">„{objection.text}“</span>
                    <ChevronRight size={18} className="shrink-0 text-ink-muted" />
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

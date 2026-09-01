import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PLAYBOOK } from "@/lib/data/playbook";

export const metadata = { title: "Leitfaden: Digitale Produkte verkaufen — CLOSER" };

export default function PlaybookPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Digitale Produkte verkaufen
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Kein „Ich zeig dir, wie du qualifizierte Leads bekommst“ ohne Erklärung. Der komplette
          Ablauf, konkret und kostenlos — vom Angebot bis zum ersten Verkauf.
        </p>
      </div>

      <Card className="!border-accent/30 !bg-accent-soft">
        <p className="text-sm leading-relaxed text-ink-soft">
          Die meisten Coaches reden über „Funnel“, „qualifizierte Leads“ und „digitales
          Marketing“, ohne je den einzelnen Schritt dahinter zu erklären. Hier sind die fünf
          Schritte, in der Reihenfolge, in der du sie wirklich brauchst.
        </p>
      </Card>

      <div className="flex flex-col gap-3">
        {PLAYBOOK.map((playbookModule) => {
          const Icon = playbookModule.icon;
          return (
            <Link key={playbookModule.id} href={`/leitfaden/${playbookModule.slug}`}>
              <Card className="flex items-center gap-4 transition-shadow hover:shadow-card">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sand text-ink-soft">
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-accent">
                    Schritt {playbookModule.order}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-ink">{playbookModule.title}</div>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">{playbookModule.summary}</p>
                </div>
                <ChevronRight size={18} className="shrink-0 text-ink-muted" />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

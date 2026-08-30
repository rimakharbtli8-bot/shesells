import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getObjectionBySlug, OBJECTIONS, OBJECTION_CATEGORIES } from "@/lib/data/objections";

export function generateStaticParams() {
  return OBJECTIONS.map((o) => ({ slug: o.slug }));
}

export default function ObjectionDetailPage({ params }: { params: { slug: string } }) {
  const objection = getObjectionBySlug(params.slug);
  if (!objection) notFound();

  const category = OBJECTION_CATEGORIES.find((c) => c.id === objection.category);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/einwaende" className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} />
        Zurück zur Bibliothek
      </Link>

      <div>
        <span className="text-xs font-medium uppercase tracking-wide text-accent">
          {category?.icon} {category?.label}
        </span>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">„{objection.text}“</h1>
      </div>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-ink">Warum Kunden das sagen</h2>
        <p className="text-sm leading-relaxed text-ink-soft">{objection.why}</p>
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-ink">Was möglicherweise wirklich dahintersteckt</h2>
        <p className="text-sm leading-relaxed text-ink-soft">{objection.behind}</p>
      </Card>

      <Card className="!border-danger/30 !bg-danger/5">
        <h2 className="mb-2 text-sm font-semibold text-danger">Was man NICHT sagen sollte</h2>
        <p className="text-sm leading-relaxed text-ink-soft">{objection.avoid}</p>
      </Card>

      <Card className="!border-accent/30 !bg-accent-soft">
        <h2 className="mb-2 text-sm font-semibold text-accent-dark">Beispiel für eine gute Reaktion</h2>
        <p className="text-sm leading-relaxed text-ink-soft">{objection.goodExample}</p>
      </Card>

      <Link href={`/trainieren?objection=${objection.slug}`}>
        <Button size="lg" className="w-full sm:w-auto">
          Diesen Einwand trainieren →
        </Button>
      </Link>
    </div>
  );
}

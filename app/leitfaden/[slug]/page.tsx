import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PLAYBOOK, getPlaybookModuleBySlug, getAdjacentPlaybookModules } from "@/lib/data/playbook";

export function generateStaticParams() {
  return PLAYBOOK.map((m) => ({ slug: m.slug }));
}

export default function PlaybookModulePage({ params }: { params: { slug: string } }) {
  const playbookModule = getPlaybookModuleBySlug(params.slug);
  if (!playbookModule) notFound();

  const Icon = playbookModule.icon;
  const { previous, next } = getAdjacentPlaybookModules(playbookModule.order);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/leitfaden" className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} />
        Zurück zum Leitfaden
      </Link>

      <div>
        <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-accent">
          <Icon size={14} />
          Schritt {playbookModule.order} von {PLAYBOOK.length}
        </span>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{playbookModule.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{playbookModule.summary}</p>
      </div>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-ink">Was du dafür brauchst</h2>
        <ul className="flex flex-col gap-1.5 text-sm leading-relaxed text-ink-soft">
          {playbookModule.whatYouNeed.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check size={16} className="mt-0.5 shrink-0 text-accent" />
              {item}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink">Schritt für Schritt</h2>
        <ol className="flex flex-col gap-3">
          {playbookModule.steps.map((step, i) => (
            <li key={step} className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </Card>

      <Card className="!border-danger/30 !bg-danger/5">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-danger">
          Typische Fehler
        </h2>
        <ul className="flex flex-col gap-1.5 text-sm leading-relaxed text-ink-soft">
          {playbookModule.mistakes.map((mistake) => (
            <li key={mistake} className="flex items-start gap-2">
              <X size={16} className="mt-0.5 shrink-0 text-danger" />
              {mistake}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="!border-accent/30 !bg-accent-soft">
        <h2 className="mb-2 text-sm font-semibold text-accent-dark">Konkretes Beispiel</h2>
        <p className="text-sm leading-relaxed text-ink-soft">{playbookModule.example}</p>
      </Card>

      <Link href={playbookModule.ctaHref}>
        <Button size="lg" className="w-full sm:w-auto">
          {playbookModule.ctaLabel} <ArrowRight size={18} />
        </Button>
      </Link>

      {(previous || next) && (
        <div className="flex items-center justify-between border-t border-line pt-4 text-sm">
          {previous ? (
            <Link
              href={`/leitfaden/${previous.slug}`}
              className="flex items-center gap-1.5 text-ink-muted hover:text-ink"
            >
              <ArrowLeft size={16} />
              {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/leitfaden/${next.slug}`}
              className="flex items-center gap-1.5 text-right text-ink-muted hover:text-ink"
            >
              {next.title}
              <ArrowRight size={16} />
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}

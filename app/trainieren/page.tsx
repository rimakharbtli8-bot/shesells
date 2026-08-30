"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { TRAINING_TYPES, DIFFICULTIES } from "@/lib/data/trainingTypes";
import { OBJECTIONS, OBJECTION_CATEGORIES, getObjectionBySlug } from "@/lib/data/objections";
import type { Difficulty, TrainingTypeId } from "@/lib/types";

function TrainierenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedObjection = searchParams.get("objection");

  const [type, setType] = useState<TrainingTypeId | null>(
    preselectedObjection ? "einwandtraining" : null,
  );
  const [objectionSlug, setObjectionSlug] = useState<string | null>(preselectedObjection);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [step, setStep] = useState<0 | 1 | 2>(preselectedObjection ? 2 : 0);

  const needsObjection = type === "einwandtraining";

  const startTraining = (finalDifficulty: Difficulty) => {
    if (!type) return;
    const params = new URLSearchParams();
    params.set("type", type);
    params.set("difficulty", finalDifficulty);
    if (needsObjection && objectionSlug) params.set("objection", objectionSlug);
    router.push(`/trainieren/simulation?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Trainieren</h1>
        <p className="mt-1 text-sm text-ink-muted">Trainiere, bevor du closen musst.</p>
      </div>

      {step === 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {TRAINING_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setType(t.id);
                  setStep(t.id === "einwandtraining" ? 1 : 2);
                }}
                className="text-left"
              >
                <Card className="flex items-start gap-3 transition-shadow hover:shadow-card">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sand text-ink">
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink">{t.title}</div>
                    <div className="mt-0.5 text-xs text-ink-muted">{t.description}</div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <BackButton onClick={() => setStep(0)} />
          <h2 className="text-lg font-medium text-ink">Welchen Einwand möchtest du trainieren?</h2>
          {OBJECTION_CATEGORIES.map((category) => (
            <div key={category.id}>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
                <category.icon size={15} className="text-accent" /> {category.label}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {OBJECTIONS.filter((o) => o.category === category.id).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      setObjectionSlug(o.slug);
                      setStep(2);
                    }}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                      objectionSlug === o.slug
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-surface text-ink hover:border-ink/40",
                    )}
                  >
                    „{o.text}“
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 2 && type && (
        <div className="flex flex-col gap-5">
          <BackButton onClick={() => setStep(needsObjection ? 1 : 0)} />
          {needsObjection && objectionSlug && (
            <Card className="!bg-sand">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Ausgewählter Einwand
              </span>
              <div className="mt-1 text-sm font-medium text-ink">
                „{getObjectionBySlug(objectionSlug)?.text}“
              </div>
            </Card>
          )}
          <h2 className="text-lg font-medium text-ink">Wähle deinen Schwierigkeitsgrad</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setDifficulty(d.id);
                  startTraining(d.id);
                }}
                className="text-left"
              >
                <Card
                  className={cn(
                    "flex items-start gap-3 transition-shadow hover:shadow-card",
                    difficulty === d.id && "ring-2 ring-ink",
                  )}
                >
                  <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", d.dotClassName)} />
                  <div>
                    <div className="text-sm font-semibold text-ink">{d.label}</div>
                    <div className="mt-0.5 text-xs text-ink-muted">{d.description}</div>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-fit items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
    >
      <ArrowLeft size={16} />
      Zurück
    </button>
  );
}

export default function TrainierenPage() {
  return (
    <Suspense>
      <TrainierenContent />
    </Suspense>
  );
}

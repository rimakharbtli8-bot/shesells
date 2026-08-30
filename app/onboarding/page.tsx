"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store/useAppStore";
import type { ExperienceLevel, TrainingGoal } from "@/lib/types";
import { APP_NAME } from "@/lib/config";

const EXPERIENCE_OPTIONS: { id: ExperienceLevel; label: string }[] = [
  { id: "anfaenger", label: "Ich bin Anfänger" },
  { id: "erfahrung", label: "Ich habe erste Sales-Erfahrung" },
  { id: "closer", label: "Ich bin bereits Closer" },
];

const GOAL_OPTIONS: { id: TrainingGoal; label: string }[] = [
  { id: "einwandbehandlung", label: "Einwandbehandlung" },
  { id: "closing", label: "Closing" },
  { id: "fragetechnik", label: "Fragetechnik" },
  { id: "selbstsicherheit", label: "Selbstsicherheit" },
  { id: "verkaufsgespraeche", label: "Verkaufsgespräche" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [goals, setGoals] = useState<TrainingGoal[]>([]);
  const [name, setName] = useState("");

  const toggleGoal = (goal: TrainingGoal) => {
    setGoals((g) => (g.includes(goal) ? g.filter((x) => x !== goal) : [...g, goal]));
  };

  const canContinue =
    (step === 0 && experience !== null) ||
    (step === 1 && goals.length > 0) ||
    (step === 2 && name.trim().length > 0);

  const finish = () => {
    if (!experience) return;
    completeOnboarding({ name: name.trim(), experience, goals });
    router.replace("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-base font-bold text-white">
            C
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Willkommen bei {APP_NAME}.
          </h1>
          <p className="mt-1 text-sm text-ink-muted">Confidence comes from reps.</p>
        </div>

        <div className="mb-6 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn("h-1.5 w-10 rounded-full", i <= step ? "bg-ink" : "bg-sand")}
            />
          ))}
        </div>

        <Card className="p-6">
          {step === 0 && (
            <div>
              <h2 className="mb-4 text-lg font-medium text-ink">Wie möchtest du trainieren?</h2>
              <div className="flex flex-col gap-2.5">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <OptionRow
                    key={opt.id}
                    label={opt.label}
                    selected={experience === opt.id}
                    onClick={() => setExperience(opt.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="mb-4 text-lg font-medium text-ink">Was möchtest du verbessern?</h2>
              <div className="flex flex-col gap-2.5">
                {GOAL_OPTIONS.map((opt) => (
                  <OptionRow
                    key={opt.id}
                    label={opt.label}
                    selected={goals.includes(opt.id)}
                    onClick={() => toggleGoal(opt.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-4 text-lg font-medium text-ink">Wie heißt du?</h2>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dein Name"
                className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-ink"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canContinue) finish();
                }}
              />
              <p className="mt-3 text-xs text-ink-muted">
                Danach erstellen wir automatisch deinen individuellen Trainingsplan.
              </p>
            </div>
          )}

          <div className="mt-7 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className={cn("text-sm text-ink-muted", step === 0 && "invisible")}
            >
              Zurück
            </button>
            {step < 2 ? (
              <Button disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
                Weiter →
              </Button>
            ) : (
              <Button disabled={!canContinue} onClick={finish}>
                Trainingsplan erstellen →
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function OptionRow({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
        selected
          ? "border-ink bg-ink text-white"
          : "border-line bg-canvas text-ink hover:border-ink/40",
      )}
    >
      {label}
      {selected && <Check size={16} />}
    </button>
  );
}

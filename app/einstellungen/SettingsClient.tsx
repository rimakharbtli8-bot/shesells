"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store/useAppStore";
import type { FEATURES } from "@/lib/config";

const EXPERIENCE_LABELS: Record<string, string> = {
  anfaenger: "Anfänger",
  erfahrung: "Erste Sales-Erfahrung",
  closer: "Bereits Closer",
};

const GOAL_LABELS: Record<string, string> = {
  einwandbehandlung: "Einwandbehandlung",
  closing: "Closing",
  fragetechnik: "Fragetechnik",
  selbstsicherheit: "Selbstsicherheit",
  verkaufsgespraeche: "Verkaufsgespräche",
};

export function SettingsClient({ features }: { features: typeof FEATURES }) {
  const profile = useAppStore((s) => s.profile);
  const updateProfileName = useAppStore((s) => s.updateProfileName);
  const leaderboardEnabled = useAppStore((s) => s.leaderboardEnabled);
  const toggleLeaderboard = useAppStore((s) => s.toggleLeaderboard);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const toggleNotifications = useAppStore((s) => s.toggleNotifications);
  const resetProgress = useAppStore((s) => s.resetProgress);

  const [name, setName] = useState(profile.name);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-ink">Profil</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">Name</label>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm outline-none focus:border-ink"
              />
              <Button variant="secondary" onClick={() => updateProfileName(name.trim())} disabled={!name.trim()}>
                Speichern
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-xs font-medium text-ink-muted">Erfahrung</span>
              <div className="text-ink">
                {profile.experience ? EXPERIENCE_LABELS[profile.experience] : "—"}
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-ink-muted">Ziele</span>
              <div className="text-ink">
                {profile.goals.length > 0
                  ? profile.goals.map((g) => GOAL_LABELS[g]).join(", ")
                  : "—"}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-ink">Allgemein</h2>
        <ToggleRow
          label="Rangliste"
          description="Zeige mich in der wöchentlichen Rangliste an."
          checked={leaderboardEnabled}
          onChange={toggleLeaderboard}
        />
        <ToggleRow
          label="Benachrichtigungen"
          description="Erinnerungen an Streaks, offene Trainings und Level-Fortschritt."
          checked={notificationsEnabled}
          onChange={toggleNotifications}
        />
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-ink">KI-Anbindung</h2>
        <p className="mb-3 text-xs text-ink-muted">
          Aktuell läuft CLOSER mit realistischen Mock-Daten. Sobald Umgebungsvariablen gesetzt sind, schaltet die App automatisch auf echte APIs um.
        </p>
        <div className="flex flex-col divide-y divide-line">
          <ApiStatusRow label="LLM (Kundenrolle & Coaching)" envVar="LLM_API_KEY" active={features.useRealLLM} />
          <ApiStatusRow label="Speech-to-Text" envVar="SPEECH_TO_TEXT_API_KEY" active={features.useRealSpeechToText} />
          <ApiStatusRow label="Text-to-Speech" envVar="TEXT_TO_SPEECH_API_KEY" active={features.useRealTextToSpeech} />
        </div>
      </Card>

      <Card className="border-danger/30">
        <h2 className="mb-1 text-sm font-semibold text-danger">Fortschritt zurücksetzen</h2>
        <p className="mb-3 text-xs text-ink-muted">
          Löscht deinen XP-Stand, Streak, Badges und deine Trainings-Historie unwiderruflich.
        </p>
        {confirmReset ? (
          <div className="flex gap-2">
            <Button variant="danger" onClick={resetProgress}>
              Ja, wirklich zurücksetzen
            </Button>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Abbrechen
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setConfirmReset(true)}>
            Fortschritt zurücksetzen
          </Button>
        )}
      </Card>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div>
        <div className="text-sm font-medium text-ink">{label}</div>
        <div className="text-xs text-ink-muted">{description}</div>
      </div>
      <button
        onClick={onChange}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-sand-dark",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

function ApiStatusRow({ label, envVar, active }: { label: string; envVar: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <div>
        <div className="text-ink">{label}</div>
        <div className="font-mono text-[11px] text-ink-muted">{envVar}</div>
      </div>
      <span
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-medium",
          active ? "bg-accent-soft text-accent-dark" : "bg-sand text-ink-muted",
        )}
      >
        {active ? "Verbunden" : "Mock-Modus"}
      </span>
    </div>
  );
}

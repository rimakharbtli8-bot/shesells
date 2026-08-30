"use client";

import Link from "next/link";
import { Flame, ArrowRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatTile } from "@/components/ui/StatTile";
import { useAppStore } from "@/lib/store/useAppStore";
import { getLevelProgress } from "@/lib/data/levels";
import { WEEKLY_PLAN, getTodayFocus } from "@/lib/data/trainingPlan";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const profile = useAppStore((s) => s.profile);
  const xp = useAppStore((s) => s.xp);
  const streak = useAppStore((s) => s.streak);
  const sessions = useAppStore((s) => s.sessions);

  const { current, next, progressPercent } = getLevelProgress(xp);
  const todayFocus = getTodayFocus();

  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const sessionsThisWeek = sessions.filter((s) => new Date(s.date).getTime() >= weekAgo);
  const successRate =
    sessions.length === 0
      ? 0
      : Math.round((sessions.filter((s) => s.score >= 70).length / sessions.length) * 100);

  const firstName = profile.name || "Closer";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Willkommen zurück, {firstName}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Heute besser als gestern.</p>
      </div>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Aktuelle Stufe
            </div>
            <div className="text-lg font-semibold text-ink">
              Closer Level {current.level} – {current.name}
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-sm font-medium text-ink-soft">
            <Flame size={16} className="text-warn" />
            {streak} Tage
          </div>
        </div>
        <div>
          <ProgressBar percent={progressPercent} />
          <div className="mt-1.5 flex justify-between text-xs text-ink-muted">
            <span>{progressPercent}%</span>
            <span>{next ? `Nächstes Level: ${next.name}` : "Höchstes Level erreicht"}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile label="Trainings diese Woche" value={String(sessionsThisWeek.length)} />
        <StatTile label="Erfolgsquote" value={`${successRate}%`} />
        <StatTile
          label="Streak"
          value={String(streak)}
          hint="Tage in Folge"
          icon={<Flame size={16} className="text-warn" />}
        />
      </div>

      <Card className="flex flex-col gap-4 !border-ink !bg-ink !text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-semibold">Weiter trainieren</div>
          <p className="mt-1 text-sm text-white/70">
            Dein nächstes Training wartet — heute im Fokus: {todayFocus.focus}.
          </p>
        </div>
        <Link href="/trainieren">
          <Button variant="secondary" size="lg" className="whitespace-nowrap !bg-white !text-ink hover:!bg-white/90">
            Training starten <ArrowRight size={18} />
          </Button>
        </Link>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Deine letzten Trainings</h2>
          <Link href="/fortschritt" className="text-sm font-medium text-accent hover:underline">
            Alle ansehen
          </Link>
        </div>
        {sessions.length === 0 ? (
          <Card className="text-sm text-ink-muted">
            Noch keine Trainings absolviert. Starte dein erstes Training, um hier deinen Verlauf zu sehen.
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sessions.slice(0, 6).map((session) => (
              <Card key={session.id} className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-ink">
                    {session.objectionText ?? "Freies Training"}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                      session.score >= 85
                        ? "bg-accent-soft text-accent-dark"
                        : session.score >= 70
                          ? "bg-sand text-ink-soft"
                          : "bg-danger/10 text-danger",
                    )}
                  >
                    {session.score}/100
                  </span>
                </div>
                <span className="text-xs text-ink-muted">{formatRelativeTime(session.date)}</span>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-ink">Dein Plan für diese Woche</h2>
        <Card className="divide-y divide-line p-0">
          {WEEKLY_PLAN.map((day) => (
            <div key={day.day} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="font-medium text-ink">{day.day}</span>
              <span className="text-ink-muted">{day.focus}</span>
            </div>
          ))}
        </Card>
      </div>

      <Link href="/coach">
        <Card className="flex items-center justify-between gap-3 transition-shadow hover:shadow-card">
          <div className="flex items-center gap-3">
            <Sparkles size={18} className="text-accent" />
            <div>
              <div className="text-sm font-semibold text-ink">Mein KI-Coach</div>
              <div className="mt-0.5 text-xs text-ink-muted">
                Frag nach, warum eine Antwort nicht funktioniert hat.
              </div>
            </div>
          </div>
          <ArrowRight size={18} className="shrink-0 text-ink-muted" />
        </Card>
      </Link>
    </div>
  );
}

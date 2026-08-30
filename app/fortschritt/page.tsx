"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAppStore } from "@/lib/store/useAppStore";
import { OBJECTIONS, OBJECTION_CATEGORIES } from "@/lib/data/objections";
import { SCORE_DIMENSIONS } from "@/lib/config";
import { formatDuration, formatRelativeTime, cn } from "@/lib/utils";
import type { ScoreDimensionKey } from "@/lib/config";

export default function FortschrittPage() {
  const sessions = useAppStore((s) => s.sessions);
  const streak = useAppStore((s) => s.streak);
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (sessions.length === 0) {
      return { total: 0, avg: 0, best: 0, time: 0, successRate: 0 };
    }
    const total = sessions.length;
    const avg = Math.round(sessions.reduce((a, s) => a + s.score, 0) / total);
    const best = Math.max(...sessions.map((s) => s.score));
    const time = sessions.reduce((a, s) => a + s.durationSeconds, 0);
    const successRate = Math.round((sessions.filter((s) => s.score >= 70).length / total) * 100);
    return { total, avg, best, time, successRate };
  }, [sessions]);

  const scoreOverTime = useMemo(
    () =>
      [...sessions]
        .reverse()
        .map((s, i) => ({ name: `#${i + 1}`, score: s.score })),
    [sessions],
  );

  const categoryData = useMemo(() => {
    return OBJECTION_CATEGORIES.map((cat) => {
      const idsInCat = new Set(OBJECTIONS.filter((o) => o.category === cat.id).map((o) => o.id));
      const count = sessions.filter((s) => s.objectionId && idsInCat.has(s.objectionId)).length;
      return { name: cat.label, count };
    });
  }, [sessions]);

  const dimensionAverages = useMemo(() => {
    if (sessions.length === 0) return [];
    return SCORE_DIMENSIONS.map((dim) => ({
      key: dim.key,
      label: dim.label,
      icon: dim.icon,
      value: Math.round(sessions.reduce((a, s) => a + s.breakdown[dim.key], 0) / sessions.length),
    }));
  }, [sessions]);

  const strongest = dimensionAverages.length
    ? [...dimensionAverages].sort((a, b) => b.value - a.value)[0]
    : null;
  const weakest = dimensionAverages.length
    ? [...dimensionAverages].sort((a, b) => a.value - b.value)[0]
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Fortschritt</h1>
        <p className="mt-1 text-sm text-ink-muted">Deine Entwicklung, ehrlich gemessen.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Trainings" value={String(stats.total)} />
        <StatTile label="Ø Score" value={String(stats.avg)} />
        <StatTile label="Bester Score" value={String(stats.best)} />
        <StatTile label="Erfolgsquote" value={`${stats.successRate}%`} />
        <StatTile label="Trainingszeit" value={formatDuration(stats.time)} />
        <StatTile label="Streak" value={`🔥 ${streak}`} />
      </div>

      {weakest && strongest && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-ink">Deine Stärken &amp; Schwächen</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-danger">Größte Schwäche</span>
              <p className="mt-1 text-sm text-ink">
                {weakest.icon} {weakest.label} – {weakest.value}%
              </p>
              <ProgressBar percent={weakest.value} barClassName="bg-danger" className="mt-2" />
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-accent-dark">Stärke</span>
              <p className="mt-1 text-sm text-ink">
                {strongest.icon} {strongest.label} – {strongest.value}%
              </p>
              <ProgressBar percent={strongest.value} className="mt-2" />
            </div>
          </div>
          <p className="mt-4 text-sm text-ink-soft">
            Deshalb empfehlen wir dir diese Woche: <span className="font-medium text-ink">→ 5 Trainings mit Fokus {weakest.label}</span>
          </p>
          <Link href="/coach" className="mt-2 inline-block text-sm font-medium text-accent hover:underline">
            Frag deinen KI-Coach dazu →
          </Link>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-ink">Score über Zeit</h2>
          {scoreOverTime.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={scoreOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E4DC" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B6B66" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6B6B66" }} width={28} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E7E4DC", fontSize: 12 }}
                />
                <Line type="monotone" dataKey="score" stroke="#1E7A4C" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState />
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-ink">Einwände nach Kategorie</h2>
          {sessions.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E4DC" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B6B66" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B6B66" }} width={24} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E7E4DC", fontSize: 12 }} />
                <Bar dataKey="count" fill="#141414" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState />
          )}
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-ink">Trainings-Historie</h2>
        <div className="flex flex-col gap-2">
          {sessions.map((session) => {
            const open = openSessionId === session.id;
            return (
              <Card key={session.id} className="cursor-pointer" onClick={() => setOpenSessionId(open ? null : session.id)}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-ink">
                      {session.objectionText ?? "Freies Training"}
                    </div>
                    <div className="text-xs text-ink-muted">{formatRelativeTime(session.date)}</div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                      session.score >= 85 ? "bg-accent-soft text-accent-dark" : "bg-sand text-ink-soft",
                    )}
                  >
                    {session.score}/100
                  </span>
                </div>
                {open && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 text-sm">
                    <DimensionRow breakdown={session.breakdown} />
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Verbesserungsvorschlag
                      </span>
                      <p className="mt-1 text-ink-soft">{session.feedback.recommendedExercise}</p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
          {sessions.length === 0 && (
            <p className="text-sm text-ink-muted">Noch keine Trainings absolviert.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DimensionRow({ breakdown }: { breakdown: Record<ScoreDimensionKey, number> }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
      {SCORE_DIMENSIONS.map((dim) => (
        <div key={dim.key} className="text-xs text-ink-muted">
          {dim.icon} {dim.label}
          <div className="text-sm font-semibold text-ink">{breakdown[dim.key]}</div>
        </div>
      ))}
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-ink-muted">
      Noch nicht genug Daten.
    </div>
  );
}

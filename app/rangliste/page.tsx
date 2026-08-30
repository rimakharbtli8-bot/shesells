"use client";

import { Medal } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useAppStore } from "@/lib/store/useAppStore";
import { MOCK_LEADERBOARD } from "@/lib/data/mockSeed";
import { cn } from "@/lib/utils";

const MEDAL_COLORS = ["text-[#C9A227]", "text-[#9AA0A6]", "text-[#B0785C]"];

export default function RanglistePage() {
  const xp = useAppStore((s) => s.xp);
  const profile = useAppStore((s) => s.profile);
  const leaderboardEnabled = useAppStore((s) => s.leaderboardEnabled);

  const you = { id: "you", name: profile.name || "Du", xp, isCurrentUser: true };
  const entries = [...MOCK_LEADERBOARD, you].sort((a, b) => b.xp - a.xp);

  if (!leaderboardEnabled) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Rangliste</h1>
        <Card className="text-sm text-ink-muted">
          Die Rangliste ist deaktiviert. Du kannst sie in den Einstellungen wieder aktivieren.
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Rangliste</h1>
        <p className="mt-1 text-sm text-ink-muted">Diese Woche — Top Closer.</p>
      </div>

      <Card className="p-0">
        <div className="divide-y divide-line">
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className={cn(
                "flex items-center justify-between px-5 py-3.5",
                entry.isCurrentUser && "bg-accent-soft",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex w-6 items-center justify-center text-sm font-semibold text-ink-muted">
                  {i < 3 ? <Medal size={18} className={MEDAL_COLORS[i]} /> : i + 1}
                </span>
                <span className={cn("text-sm font-medium text-ink", entry.isCurrentUser && "text-accent-dark")}>
                  {entry.name}
                  {entry.isCurrentUser && " (du)"}
                </span>
              </div>
              <span className="text-sm font-semibold text-ink">{entry.xp.toLocaleString("de-DE")} XP</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

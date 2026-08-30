import type { Level } from "@/lib/types";

export const LEVELS: Level[] = [
  { level: 1, name: "Rookie", minXp: 0 },
  { level: 2, name: "Listener", minXp: 300 },
  { level: 3, name: "Communicator", minXp: 700 },
  { level: 4, name: "Negotiator", minXp: 1300 },
  { level: 5, name: "Closer", minXp: 2100 },
  { level: 6, name: "Elite Closer", minXp: 3100 },
  { level: 7, name: "Sales Master", minXp: 4300 },
  { level: 8, name: "Closing Beast", minXp: 5700 },
  { level: 9, name: "Negotiation Expert", minXp: 7300 },
  { level: 10, name: "Sales Legend", minXp: 9100 },
];

export function getLevelForXp(xp: number): Level {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.minXp) current = level;
  }
  return current;
}

export function getNextLevel(xp: number): Level | null {
  const current = getLevelForXp(xp);
  return LEVELS.find((l) => l.level === current.level + 1) ?? null;
}

export function getLevelProgress(xp: number): {
  current: Level;
  next: Level | null;
  progressPercent: number;
  xpIntoLevel: number;
  xpForNext: number;
} {
  const current = getLevelForXp(xp);
  const next = getNextLevel(xp);
  if (!next) {
    return { current, next: null, progressPercent: 100, xpIntoLevel: 0, xpForNext: 0 };
  }
  const xpIntoLevel = xp - current.minXp;
  const xpForNext = next.minXp - current.minXp;
  const progressPercent = Math.min(100, Math.round((xpIntoLevel / xpForNext) * 100));
  return { current, next, progressPercent, xpIntoLevel, xpForNext };
}

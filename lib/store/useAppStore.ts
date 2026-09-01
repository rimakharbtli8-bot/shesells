"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExperienceLevel, TrainingGoal, TrainingSession, UserProfile } from "@/lib/types";
import { LEADERBOARD_ENABLED_DEFAULT, XP_REWARDS } from "@/lib/config";
import { BADGES } from "@/lib/data/badges";
import { uid } from "@/lib/utils";

interface AppState {
  hasHydrated: boolean;
  profile: UserProfile;
  xp: number;
  streak: number;
  lastTrainingISODate: string | null;
  sessions: TrainingSession[];
  earnedBadgeIds: string[];
  leaderboardEnabled: boolean;
  notificationsEnabled: boolean;

  setHasHydrated: (v: boolean) => void;
  completeOnboarding: (data: { name: string; experience: ExperienceLevel; goals: TrainingGoal[] }) => void;
  addSession: (session: Omit<TrainingSession, "id" | "date" | "xpEarned">) => TrainingSession;
  toggleLeaderboard: () => void;
  toggleNotifications: () => void;
  updateProfileName: (name: string) => void;
  resetProgress: () => void;
}

// Calendar day in the user's own timezone, not UTC — toISOString() would
// shift a training done shortly after local midnight (very common for
// evening training in a UTC+1/+2 timezone like Germany) onto the
// previous UTC day, silently breaking the streak count.
function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeStreak(lastISODate: string | null, currentStreak: number): number {
  if (!lastISODate) return 1;
  const last = todayKey(new Date(lastISODate));
  const today = todayKey();
  if (last === today) return currentStreak || 1;
  const yesterday = todayKey(new Date(Date.now() - 24 * 3600 * 1000));
  if (last === yesterday) return (currentStreak || 0) + 1;
  return 1;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      profile: {
        name: "",
        experience: null,
        goals: [],
        onboardingComplete: false,
      },
      xp: 0,
      streak: 0,
      lastTrainingISODate: null,
      sessions: [],
      earnedBadgeIds: [],
      leaderboardEnabled: LEADERBOARD_ENABLED_DEFAULT,
      notificationsEnabled: true,

      setHasHydrated: (v) => set({ hasHydrated: v }),

      completeOnboarding: ({ name, experience, goals }) =>
        set({
          profile: { name, experience, goals, onboardingComplete: true },
        }),

      addSession: (partial) => {
        const state = get();
        const isPersonalBest =
          state.sessions.length === 0 || partial.score > Math.max(...state.sessions.map((s) => s.score));

        let xpEarned = XP_REWARDS.TRAINING_COMPLETED;
        if (partial.score >= 70) xpEarned += XP_REWARDS.OBJECTION_SOLVED;
        if (isPersonalBest) xpEarned += XP_REWARDS.PERSONAL_BEST;

        const newStreak = computeStreak(state.lastTrainingISODate, state.streak);
        if (newStreak > 0 && newStreak % 7 === 0) {
          xpEarned += XP_REWARDS.SEVEN_DAY_STREAK;
        }

        const session: TrainingSession = {
          ...partial,
          id: uid("session"),
          date: new Date().toISOString(),
          xpEarned,
        };

        const newBadges = new Set(state.earnedBadgeIds);
        if (partial.score >= 90) newBadges.add("first-90");
        if (partial.score >= 100) newBadges.add("first-perfect");
        if (newStreak >= 7) newBadges.add("streak-7");
        if (state.sessions.length + 1 >= 100) newBadges.add("100-conversations");

        set({
          sessions: [session, ...state.sessions],
          xp: state.xp + xpEarned,
          streak: newStreak,
          lastTrainingISODate: session.date,
          earnedBadgeIds: Array.from(newBadges),
        });

        return session;
      },

      toggleLeaderboard: () => set((s) => ({ leaderboardEnabled: !s.leaderboardEnabled })),
      toggleNotifications: () => set((s) => ({ notificationsEnabled: !s.notificationsEnabled })),
      updateProfileName: (name) => set((s) => ({ profile: { ...s.profile, name } })),

      resetProgress: () =>
        set({
          xp: 0,
          streak: 0,
          lastTrainingISODate: null,
          sessions: [],
          earnedBadgeIds: [],
          profile: { name: "", experience: null, goals: [], onboardingComplete: false },
        }),
    }),
    {
      name: "closer-app-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export const ALL_BADGES = BADGES;

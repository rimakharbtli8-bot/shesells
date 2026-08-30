import type { Challenge } from "@/lib/types";

export const WEEKLY_CHALLENGES: Challenge[] = [
  {
    id: "price-10",
    title: "Preis-Profi",
    description: "Löse diese Woche 10 Preis-Einwände.",
    rewardXp: 300,
    badgeId: "objection-master",
    target: 10,
    metric: "objections_price",
  },
  {
    id: "streak-5",
    title: "Dranbleiber",
    description: "Trainiere 5 Tage hintereinander.",
    rewardXp: 250,
    badgeId: "streak-7",
    target: 5,
    metric: "streak_days",
  },
  {
    id: "score-85-x3",
    title: "Konstant stark",
    description: "Erreiche mindestens 85 Punkte in drei Trainings.",
    rewardXp: 200,
    target: 3,
    metric: "score_85_plus",
  },
  {
    id: "sessions-20",
    title: "Vielspieler",
    description: "Schließe 20 Simulationen ab.",
    rewardXp: 350,
    badgeId: "100-conversations",
    target: 20,
    metric: "sessions_completed",
  },
];

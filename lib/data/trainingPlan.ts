export interface PlanDay {
  day: string;
  focus: string;
}

export const WEEKLY_PLAN: PlanDay[] = [
  { day: "Montag", focus: "Preis-Einwände" },
  { day: "Dienstag", focus: "Fragetechnik" },
  { day: "Mittwoch", focus: "Partner-Einwand" },
  { day: "Donnerstag", focus: "Closing" },
  { day: "Freitag", focus: "Freies Gespräch" },
  { day: "Samstag", focus: "Challenge" },
  { day: "Sonntag", focus: "Wochenanalyse" },
];

export function getTodayFocus(): PlanDay {
  const idx = (new Date().getDay() + 6) % 7; // Monday = 0
  return WEEKLY_PLAN[idx];
}

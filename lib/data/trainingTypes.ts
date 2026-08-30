import type { Difficulty, TrainingTypeId } from "@/lib/types";

export const TRAINING_TYPES: {
  id: TrainingTypeId;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "einwandtraining",
    title: "Einwandtraining",
    description: "Trainiere gezielt einen einzelnen Einwand bis er sitzt.",
    icon: "🎯",
  },
  {
    id: "komplett",
    title: "Komplettes Verkaufsgespräch",
    description: "Vom Einstieg bis zum Abschluss — das volle Gespräch.",
    icon: "🗂️",
  },
  {
    id: "discovery",
    title: "Discovery Call",
    description: "Bedarf ermitteln, Fragetechnik und aktives Zuhören üben.",
    icon: "🔍",
  },
  {
    id: "closing",
    title: "Closing",
    description: "Den Abschluss souverän einleiten und durchziehen.",
    icon: "🤝",
  },
  {
    id: "frei",
    title: "Freies Training",
    description: "Offenes Gespräch ohne vorgegebenes Szenario.",
    icon: "🎲",
  },
];

export const DIFFICULTIES: {
  id: Difficulty;
  label: string;
  icon: string;
  description: string;
}[] = [
  { id: "anfaenger", label: "Anfänger", icon: "🟢", description: "Kunde ist grundsätzlich wohlwollend." },
  { id: "fortgeschritten", label: "Fortgeschritten", icon: "🟡", description: "Kunde hinterfragt normal kritisch." },
  { id: "schwer", label: "Schwer", icon: "🟠", description: "Kunde ist skeptisch und hakt nach." },
  { id: "experte", label: "Experte", icon: "🔴", description: "Kunde ist hart, ungeduldig und preissensibel." },
];

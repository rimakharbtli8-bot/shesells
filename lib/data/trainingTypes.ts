import { Target, Layers, Search, Handshake, Shuffle, type LucideIcon } from "lucide-react";
import type { Difficulty, TrainingTypeId } from "@/lib/types";

export const TRAINING_TYPES: {
  id: TrainingTypeId;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: "einwandtraining",
    title: "Einwandtraining",
    description: "Trainiere gezielt einen einzelnen Einwand bis er sitzt.",
    icon: Target,
  },
  {
    id: "komplett",
    title: "Komplettes Verkaufsgespräch",
    description: "Vom Einstieg bis zum Abschluss — das volle Gespräch.",
    icon: Layers,
  },
  {
    id: "discovery",
    title: "Discovery Call",
    description: "Bedarf ermitteln, Fragetechnik und aktives Zuhören üben.",
    icon: Search,
  },
  {
    id: "closing",
    title: "Closing",
    description: "Den Abschluss souverän einleiten und durchziehen.",
    icon: Handshake,
  },
  {
    id: "frei",
    title: "Freies Training",
    description: "Offenes Gespräch ohne vorgegebenes Szenario.",
    icon: Shuffle,
  },
];

export const DIFFICULTIES: {
  id: Difficulty;
  label: string;
  dotClassName: string;
  description: string;
}[] = [
  { id: "anfaenger", label: "Anfänger", dotClassName: "bg-accent", description: "Kunde ist grundsätzlich wohlwollend." },
  { id: "fortgeschritten", label: "Fortgeschritten", dotClassName: "bg-warn", description: "Kunde hinterfragt normal kritisch." },
  { id: "schwer", label: "Schwer", dotClassName: "bg-danger/70", description: "Kunde ist skeptisch und hakt nach." },
  { id: "experte", label: "Experte", dotClassName: "bg-danger", description: "Kunde ist hart, ungeduldig und preissensibel." },
];

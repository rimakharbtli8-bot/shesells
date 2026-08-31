import type { LucideIcon } from "lucide-react";
import type { ScoreDimensionKey } from "./config";

export type Difficulty = "anfaenger" | "fortgeschritten" | "schwer" | "experte";

export type TrainingTypeId =
  | "einwandtraining"
  | "komplett"
  | "discovery"
  | "closing"
  | "frei";

export type ObjectionCategoryId =
  | "preis"
  | "timing"
  | "vertrauen"
  | "produkt"
  | "commitment";

export interface Objection {
  id: string;
  slug: string;
  category: ObjectionCategoryId;
  text: string;
  why: string;
  behind: string;
  avoid: string;
  goodExample: string;
  followUps: string[];
}

export type ScoreBreakdown = Record<ScoreDimensionKey, number>;

export interface ChatMessage {
  id: string;
  role: "customer" | "user" | "system";
  text: string;
  timestamp: number;
  inputMode?: "text" | "voice";
}

export interface SessionFeedback {
  good: string[];
  improve: string[];
  focus: string;
  recommendedExercise: string;
  /** What the customer was actually feeling underneath the surface objection. */
  customerFeltReport: string;
  /** Process-based explanation of how a strong closer would have approached
   *  this moment — the reasoning, not a copyable line to memorize. */
  goldenPath: string;
}

export interface CustomerPersona {
  name: string;
  archetype: string;
  ageContext: string;
  communicationStyle: string;
  decisionMakingStyle: string;
  patienceLevel: "niedrig" | "mittel" | "hoch";
  /** Private context the customer knows but won't volunteer unprompted —
   *  the seller has to earn it through good discovery questions. */
  hiddenGoal: string;
  hiddenPain: string;
  hiddenPreviousAttempt: string;
  hiddenRealConcern: string;
}

export interface CustomerEmotionalState {
  trust: number;
  interest: number;
  skepticism: number;
  frustration: number;
  defensiveness: number;
  urgency: number;
  confusion: number;
}

export interface TrainingSession {
  id: string;
  date: string;
  trainingType: TrainingTypeId;
  difficulty: Difficulty;
  objectionId?: string;
  objectionText?: string;
  transcript: ChatMessage[];
  score: number;
  breakdown: ScoreBreakdown;
  feedback: SessionFeedback;
  durationSeconds: number;
  xpEarned: number;
}

export interface Level {
  level: number;
  name: string;
  minXp: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  rewardXp: number;
  badgeId?: string;
  target: number;
  metric: "objections_price" | "streak_days" | "score_85_plus" | "sessions_completed";
}

export type ExperienceLevel = "anfaenger" | "erfahrung" | "closer";

export type TrainingGoal =
  | "einwandbehandlung"
  | "closing"
  | "fragetechnik"
  | "selbstsicherheit"
  | "verkaufsgespraeche";

export interface UserProfile {
  name: string;
  experience: ExperienceLevel | null;
  goals: TrainingGoal[];
  onboardingComplete: boolean;
}

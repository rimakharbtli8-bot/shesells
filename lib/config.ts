import { Brain, Flame, Heart, MessageCircle, Puzzle, Target, Timer, type LucideIcon } from "lucide-react";

/**
 * Central configuration for CLOSER.
 *
 * Anything that should be editable without touching component code lives
 * here: the WhatsApp community link, XP rewards, and feature flags.
 * Server-only secrets (LLM / STT / TTS keys) are read from process.env
 * inside app/api/* route handlers only — never imported into client code.
 */

export const WHATSAPP_COMMUNITY_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL || "HIER_SPAETER_LINK_EINFUEGEN";

export const APP_NAME = "CLOSER";

export const XP_REWARDS = {
  TRAINING_COMPLETED: 100,
  OBJECTION_SOLVED: 50,
  PERSONAL_BEST: 100,
  SEVEN_DAY_STREAK: 250,
  PERFECT_ANSWER_BONUS: 30,
} as const;

export const LEADERBOARD_ENABLED_DEFAULT = true;

// Feature flags — flip these once a real backend/API key exists.
export const FEATURES = {
  useRealLLM: Boolean(process.env.LLM_API_KEY),
  useRealSpeechToText: Boolean(process.env.SPEECH_TO_TEXT_API_KEY),
  useRealTextToSpeech: Boolean(process.env.TEXT_TO_SPEECH_API_KEY),
};

export const SCORE_DIMENSIONS: { key: ScoreDimensionKey; label: string; icon: LucideIcon }[] = [
  { key: "understanding", label: "Einwand verstanden", icon: Target },
  { key: "questioning", label: "Fragetechnik", icon: Brain },
  { key: "communication", label: "Kommunikation", icon: MessageCircle },
  { key: "empathy", label: "Empathie", icon: Heart },
  { key: "confidence", label: "Sicherheit", icon: Flame },
  { key: "structure", label: "Struktur", icon: Puzzle },
  { key: "concision", label: "Prägnanz", icon: Timer },
];

export type ScoreDimensionKey =
  | "understanding"
  | "questioning"
  | "communication"
  | "empathy"
  | "confidence"
  | "structure"
  | "concision";

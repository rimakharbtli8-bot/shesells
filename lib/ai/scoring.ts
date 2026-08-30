import type { ScoreBreakdown, SessionFeedback } from "@/lib/types";
import type { Difficulty } from "@/lib/types";

const FILLER_WORDS = [
  "äh",
  "ähm",
  "halt",
  "irgendwie",
  "eigentlich",
  "quasi",
  "sozusagen",
  "ja also",
  "keine ahnung",
];

const HEDGING_WORDS = ["vielleicht", "ich glaube", "eventuell", "könnte sein", "ich hoffe", "irgendwann mal"];

const EMPATHY_MARKERS = [
  "verstehe",
  "nachvollziehen",
  "kann ich verstehen",
  "macht sinn",
  "total nachvollziehbar",
  "berechtigt",
];

export interface ReplyAnalysis {
  wordCount: number;
  fillerCount: number;
  hedgingCount: number;
  hasQuestion: boolean;
  hasOpenQuestion: boolean;
  hasEmpathyMarker: boolean;
  estimatedSeconds: number;
}

export function analyzeReply(text: string, spokenSeconds?: number): ReplyAnalysis {
  const clean = text.trim();
  const lower = clean.toLowerCase();
  const words = clean.length ? clean.split(/\s+/) : [];
  const fillerCount = FILLER_WORDS.reduce(
    (acc, f) => acc + (lower.includes(f) ? 1 : 0),
    0,
  );
  const hedgingCount = HEDGING_WORDS.reduce((acc, h) => acc + (lower.includes(h) ? 1 : 0), 0);
  const hasQuestion = clean.includes("?");
  const hasOpenQuestion =
    /\b(was|wie|warum|wieso|weshalb|wobei|welche|wodurch)\b[^?]*\?/i.test(clean);
  const hasEmpathyMarker = EMPATHY_MARKERS.some((m) => lower.includes(m));
  const estimatedSeconds = spokenSeconds ?? Math.max(3, Math.round((words.length / 2.5)));

  return {
    wordCount: words.length,
    fillerCount,
    hedgingCount,
    hasQuestion,
    hasOpenQuestion,
    hasEmpathyMarker,
    estimatedSeconds,
  };
}

const DIFFICULTY_STRICTNESS: Record<Difficulty, number> = {
  anfaenger: 0.85,
  fortgeschritten: 1,
  schwer: 1.12,
  experte: 1.25,
};

export function scoreReply(text: string, difficulty: Difficulty, spokenSeconds?: number): ScoreBreakdown {
  const a = analyzeReply(text, spokenSeconds);
  const strictness = DIFFICULTY_STRICTNESS[difficulty];

  const clamp = (n: number) => Math.max(20, Math.min(100, Math.round(n)));

  const lengthPenalty = a.wordCount < 4 ? 25 : a.wordCount > 90 ? 10 : 0;

  const understanding = clamp(
    (a.wordCount > 5 ? 78 : 55) + (a.hasEmpathyMarker ? 8 : 0) - lengthPenalty * 0.6,
  );
  const questioning = clamp(
    (a.hasOpenQuestion ? 85 : a.hasQuestion ? 68 : 45) - a.hedgingCount * 4,
  );
  const communication = clamp(
    80 - a.fillerCount * 7 - a.hedgingCount * 5 - lengthPenalty * 0.5,
  );
  const empathy = clamp((a.hasEmpathyMarker ? 90 : 62) - a.fillerCount * 2);
  const confidence = clamp(82 - a.hedgingCount * 10 - a.fillerCount * 4);
  const structure = clamp(
    75 + (a.hasOpenQuestion ? 8 : 0) - (a.wordCount > 80 ? 12 : 0) - lengthPenalty * 0.4,
  );
  const idealWords = 35;
  const concisionRaw = 100 - Math.abs(a.wordCount - idealWords) * 1.1;
  const concision = clamp(concisionRaw);

  const applyStrictness = (n: number) => Math.max(15, Math.min(100, Math.round(n / strictness)));

  return {
    understanding: applyStrictness(understanding),
    questioning: applyStrictness(questioning),
    communication: applyStrictness(communication),
    empathy: applyStrictness(empathy),
    confidence: applyStrictness(confidence),
    structure: applyStrictness(structure),
    concision: applyStrictness(concision),
  };
}

export function overallScore(breakdown: ScoreBreakdown): number {
  const values = Object.values(breakdown);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function buildFeedback(
  breakdown: ScoreBreakdown,
  analysis: ReplyAnalysis,
  objectionText: string,
): SessionFeedback {
  const good: string[] = [];
  const improve: string[] = [];

  if (breakdown.empathy >= 80) {
    good.push("Du bist einfühlsam auf den Einwand eingegangen, bevor du reagiert hast.");
  }
  if (breakdown.questioning >= 80) {
    good.push("Starke offene Frage — du hast den Kunden zum Reden gebracht statt selbst zu argumentieren.");
  }
  if (breakdown.confidence >= 80) {
    good.push("Dein Ton war sicher und ohne unnötige Relativierungen.");
  }
  if (breakdown.concision >= 80) {
    good.push("Gute Länge — auf den Punkt, ohne abzuschweifen.");
  }
  if (good.length === 0) {
    good.push("Du hast den Einwand nicht ignoriert und direkt reagiert.");
  }

  if (analysis.fillerCount > 1) {
    improve.push(
      `Du hast ${analysis.fillerCount} Füllwörter verwendet (z.B. "äh", "halt"). Das kostet Sicherheit in der Wirkung.`,
    );
  }
  if (analysis.hedgingCount > 0) {
    improve.push(
      "Vermeide relativierende Formulierungen wie „ich glaube“ oder „vielleicht“ — sie schwächen deine Aussage.",
    );
  }
  if (!analysis.hasOpenQuestion) {
    improve.push(
      `Du bist zu schnell in die Argumentation gegangen. Besser wäre gewesen, zunächst eine offene Frage zum Einwand „${objectionText}“ zu stellen.`,
    );
  }
  if (analysis.estimatedSeconds > 35) {
    improve.push(
      `Deine Antwort war ${analysis.estimatedSeconds} Sekunden lang. Für diesen Einwand wäre eine kürzere, fokussierte Antwort wahrscheinlich stärker gewesen.`,
    );
  }
  if (analysis.wordCount < 6) {
    improve.push("Deine Antwort war sehr kurz — der Kunde bekommt kaum das Gefühl, verstanden zu werden.");
  }
  if (improve.length === 0) {
    improve.push("Kleinigkeiten — achte weiter auf eine noch klarere Struktur in der Antwort.");
  }

  const dimensionEntries = Object.entries(breakdown) as [keyof ScoreBreakdown, number][];
  const weakest = dimensionEntries.reduce((min, cur) => (cur[1] < min[1] ? cur : min));

  const focusLabels: Record<string, string> = {
    understanding: "Einwandverständnis",
    questioning: "Fragetechnik",
    communication: "Kommunikation",
    empathy: "Empathie",
    confidence: "Sicherheit im Ton",
    structure: "Gesprächsstruktur",
    concision: "Prägnanz",
  };

  const focus = focusLabels[weakest[0]];

  return {
    good,
    improve,
    focus,
    recommendedExercise: `Trainiere als nächstes gezielt „${focus}“ — z.B. mit 3 weiteren Einwänden aus derselben Kategorie.`,
  };
}

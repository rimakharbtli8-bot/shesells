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

const DISMISSIVE_MARKERS = ["keine ahnung", "weiß nicht", "egal", "keine lust", "wie auch immer"];

const STOPWORDS = new Set([
  "der",
  "die",
  "das",
  "und",
  "ist",
  "ich",
  "du",
  "wir",
  "ein",
  "eine",
  "zu",
  "mit",
  "für",
  "auf",
  "im",
  "in",
  "es",
  "dass",
  "sich",
  "nicht",
  "auch",
  "wie",
  "was",
  "dir",
  "mir",
]);

export interface ReplyAnalysis {
  wordCount: number;
  fillerCount: number;
  hedgingCount: number;
  hasQuestion: boolean;
  hasOpenQuestion: boolean;
  hasEmpathyMarker: boolean;
  isDismissive: boolean;
  objectionOverlap: number;
  estimatedSeconds: number;
}

export function analyzeReply(text: string, spokenSeconds?: number, objectionText?: string): ReplyAnalysis {
  const clean = text.trim();
  const lower = clean.toLowerCase();
  const words = clean.length ? clean.split(/\s+/) : [];
  const fillerCount = FILLER_WORDS.reduce((acc, f) => acc + (lower.includes(f) ? 1 : 0), 0);
  const hedgingCount = HEDGING_WORDS.reduce((acc, h) => acc + (lower.includes(h) ? 1 : 0), 0);
  const hasQuestion = clean.includes("?");
  const hasOpenQuestion = /\b(was|wie|warum|wieso|weshalb|wobei|welche|wodurch)\b[^?]*\?/i.test(clean);
  const hasEmpathyMarker = EMPATHY_MARKERS.some((m) => lower.includes(m));
  const isDismissive = DISMISSIVE_MARKERS.some((m) => lower.includes(m)) || words.length <= 2;
  const estimatedSeconds = spokenSeconds ?? Math.max(2, Math.round(words.length / 2.5));

  let objectionOverlap = 0;
  if (objectionText) {
    const objectionWords = new Set(
      objectionText
        .toLowerCase()
        .replace(/[„“"?.,!]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOPWORDS.has(w)),
    );
    const replyWords = new Set(lower.replace(/[„“"?.,!]/g, "").split(/\s+/));
    let hits = 0;
    objectionWords.forEach((w) => {
      if (replyWords.has(w)) hits += 1;
    });
    objectionOverlap = objectionWords.size > 0 ? hits / objectionWords.size : 0;
  }

  return {
    wordCount: words.length,
    fillerCount,
    hedgingCount,
    hasQuestion,
    hasOpenQuestion,
    hasEmpathyMarker,
    isDismissive,
    objectionOverlap,
    estimatedSeconds,
  };
}

const DIFFICULTY_STRICTNESS: Record<Difficulty, number> = {
  anfaenger: 0.85,
  fortgeschritten: 1,
  schwer: 1.15,
  experte: 1.3,
};

/** Deterministic pseudo-random jitter per text+dimension, so identical
 *  input always scores the same, but different answers don't cluster
 *  into an identical shape across all seven dimensions. */
function jitter(seed: string, spread: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const normalized = (Math.abs(hash) % 1000) / 1000; // 0..1
  return (normalized - 0.5) * 2 * spread;
}

export function scoreReply(
  text: string,
  difficulty: Difficulty,
  spokenSeconds?: number,
  objectionText?: string,
): ScoreBreakdown {
  const a = analyzeReply(text, spokenSeconds, objectionText);
  const strictness = DIFFICULTY_STRICTNESS[difficulty];

  const clamp = (n: number) => Math.max(8, Math.min(100, Math.round(n)));

  if (a.isDismissive) {
    // A one-word or "keine ahnung" answer doesn't earn a partial score
    // across the board — the customer got nothing to work with.
    const floor = 12;
    return {
      understanding: floor,
      questioning: floor,
      communication: floor + 5,
      empathy: floor,
      confidence: floor + 5,
      structure: floor,
      concision: 45,
    };
  }

  const lengthPenalty = a.wordCount < 6 ? (6 - a.wordCount) * 8 : a.wordCount > 90 ? (a.wordCount - 90) * 0.4 : 0;
  const relevanceBonus = a.objectionOverlap * 18;

  // Additive scoring: start low (a mediocre, generic reply) and earn
  // points for concrete positive signals instead of starting near the
  // top and only losing a little for mistakes.
  const understanding = clamp(
    40 + relevanceBonus + (a.wordCount >= 10 ? 12 : 0) + (a.hasEmpathyMarker ? 10 : 0) - lengthPenalty + jitter(text + "u", 6),
  );
  const questioning = clamp(
    30 + (a.hasOpenQuestion ? 45 : a.hasQuestion ? 22 : 0) - a.hedgingCount * 5 + jitter(text + "q", 6),
  );
  const communication = clamp(
    55 + (a.wordCount >= 8 && a.wordCount <= 60 ? 15 : 0) - a.fillerCount * 9 - a.hedgingCount * 6 - lengthPenalty + jitter(text + "c", 5),
  );
  const empathy = clamp(35 + (a.hasEmpathyMarker ? 45 : 10) - a.fillerCount * 3 + jitter(text + "e", 7));
  const confidence = clamp(65 - a.hedgingCount * 12 - a.fillerCount * 5 - (a.wordCount < 6 ? 20 : 0) + jitter(text + "co", 6));
  const structure = clamp(
    38 + (a.hasOpenQuestion ? 20 : 0) + (a.wordCount >= 10 ? 15 : 0) - (a.wordCount > 80 ? 15 : 0) - lengthPenalty + jitter(text + "s", 6),
  );
  const idealWords = 35;
  const concisionRaw = 92 - Math.abs(a.wordCount - idealWords) * 1.3;
  const concision = clamp(concisionRaw + jitter(text + "co2", 4));

  const applyStrictness = (n: number) => Math.max(8, Math.min(100, Math.round(n / strictness)));

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

  if (breakdown.empathy >= 75) {
    good.push("Du bist einfühlsam auf den Einwand eingegangen, bevor du reagiert hast.");
  }
  if (breakdown.questioning >= 75) {
    good.push("Starke offene Frage — du hast den Kunden zum Reden gebracht statt selbst zu argumentieren.");
  }
  if (breakdown.confidence >= 75) {
    good.push("Dein Ton war sicher und ohne unnötige Relativierungen.");
  }
  if (breakdown.concision >= 75) {
    good.push("Gute Länge — auf den Punkt, ohne abzuschweifen.");
  }
  if (good.length === 0) {
    good.push("Du hast den Einwand nicht ignoriert und direkt reagiert.");
  }

  if (analysis.isDismissive) {
    improve.push("Deine Antwort war zu knapp, um den Einwand ernsthaft zu bearbeiten — der Kunde fühlt sich nicht abgeholt.");
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
  if (!analysis.hasOpenQuestion && !analysis.isDismissive) {
    improve.push(
      `Du bist zu schnell in die Argumentation gegangen. Besser wäre gewesen, zunächst eine offene Frage zum Einwand „${objectionText}“ zu stellen.`,
    );
  }
  if (analysis.estimatedSeconds > 35) {
    improve.push(
      `Deine Antwort war ${analysis.estimatedSeconds} Sekunden lang. Für diesen Einwand wäre eine kürzere, fokussierte Antwort wahrscheinlich stärker gewesen.`,
    );
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

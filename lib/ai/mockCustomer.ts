import type { Difficulty, Objection, TrainingTypeId } from "@/lib/types";
import { overallScore, scoreReply } from "@/lib/ai/scoring";

const DIFFICULTY_START_RESISTANCE: Record<Difficulty, number> = {
  anfaenger: 35,
  fortgeschritten: 50,
  schwer: 68,
  experte: 82,
};

const DIFFICULTY_TONE: Record<Difficulty, string> = {
  anfaenger: "freundlich, aber unsicher",
  fortgeschritten: "normal kritisch",
  schwer: "skeptisch und nachhakend",
  experte: "hart, ungeduldig, sehr preissensibel",
};

const SKEPTICAL_REACTIONS = [
  "Hm, ganz überzeugt bin ich trotzdem noch nicht.",
  "Okay... aber das beantwortet meine eigentliche Sorge noch nicht ganz.",
  "Klingt gut, aber woher weiß ich, dass das bei mir auch funktioniert?",
  "Verstehe ich, trotzdem zögere ich noch.",
  "Das klingt nach der üblichen Verkäufer-Antwort, ehrlich gesagt.",
];

const RESISTANT_REACTIONS = [
  "Nein, so einfach ist das für mich nicht.",
  "Das überzeugt mich ehrlich gesagt gar nicht.",
  "Ich glaube, wir sind da unterschiedlicher Meinung.",
  "Das fühlt sich für mich nach einer Standard-Antwort an.",
  "Ganz ehrlich? Das macht es für mich eher schlimmer.",
];

const WARMING_REACTIONS = [
  "Okay, das ergibt tatsächlich Sinn.",
  "Gut erklärt — das hilft mir schon weiter.",
  "Verstehe. Das nimmt mir schon etwas die Sorge.",
  "Interessant, so hatte ich das noch nicht gesehen.",
];

const CLOSING_REACTIONS = [
  "Okay, du hast mich überzeugt. Was wären die nächsten Schritte?",
  "Gut, das klingt jetzt wirklich stimmig für mich. Wie geht es weiter?",
  "Alles klar — ich glaube, ich bin bereit, das anzugehen.",
];

export interface CustomerTurnResult {
  text: string;
  resistance: number;
  isClosing: boolean;
  quality: number;
}

export function getOpeningLine(
  trainingType: TrainingTypeId,
  difficulty: Difficulty,
  objection?: Objection,
): string {
  if (objection) {
    const intensifier =
      difficulty === "experte"
        ? " Ganz ehrlich, ich habe nicht viel Zeit für lange Erklärungen."
        : difficulty === "schwer"
          ? " Und bitte keine 08/15-Antwort."
          : "";
    return `${objection.text}${intensifier}`;
  }

  switch (trainingType) {
    case "discovery":
      return "Okay, erzähl mir kurz — worum geht es und warum sollte mich das interessieren?";
    case "closing":
      return "Gut, ich habe jetzt alles gehört. Aber ich bin mir noch nicht sicher, ob ich heute unterschreiben will.";
    case "komplett":
      return "Hi, ich habe gesehen, dass wir einen Termin haben. Worum geht's genau?";
    default:
      return "Alles klar, ich höre zu. Was möchtest du mir zeigen?";
  }
}

export function generateCustomerTurn(params: {
  userReply: string;
  difficulty: Difficulty;
  resistance: number;
  turn: number;
  objection?: Objection;
}): CustomerTurnResult {
  const { userReply, difficulty, resistance, turn, objection } = params;
  const breakdown = scoreReply(userReply, difficulty);
  const quality = overallScore(breakdown);

  let delta = 0;
  if (quality >= 80) delta = -22;
  else if (quality >= 65) delta = -10;
  else if (quality >= 50) delta = 4;
  else delta = 16;

  const nextResistance = Math.max(0, Math.min(100, resistance + delta));
  const maxTurns = 5;
  const shouldClose = nextResistance <= 22 || turn >= maxTurns;

  let text: string;
  if (shouldClose) {
    text = pick(CLOSING_REACTIONS);
  } else if (quality >= 80 && objection && objection.followUps.length > 0) {
    const followUp = objection.followUps[turn % objection.followUps.length];
    text = `${pick(WARMING_REACTIONS)} Aber sag mal — ${followUp.charAt(0).toLowerCase()}${followUp.slice(1)}`;
  } else if (quality >= 65) {
    text = pick(WARMING_REACTIONS);
  } else if (quality >= 50) {
    text = pick(SKEPTICAL_REACTIONS);
  } else {
    text = pick(RESISTANT_REACTIONS);
  }

  return { text, resistance: nextResistance, isClosing: shouldClose, quality };
}

export function getStartingResistance(difficulty: Difficulty): number {
  return DIFFICULTY_START_RESISTANCE[difficulty];
}

export function getDifficultyTone(difficulty: Difficulty): string {
  return DIFFICULTY_TONE[difficulty];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

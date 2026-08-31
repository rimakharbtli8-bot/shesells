import type { CustomerEmotionalState, CustomerPersona, Difficulty } from "@/lib/types";

interface Archetype {
  id: string;
  label: string;
  communicationStyle: string;
  decisionMakingStyle: string;
  patienceLevel: CustomerPersona["patienceLevel"];
}

// The twelve customer types — each nudges tone, pacing, and what actually
// moves them, so the same objection plays out differently persona to persona.
const ARCHETYPES: Archetype[] = [
  { id: "skeptic", label: "Der Skeptiker", communicationStyle: "hinterfragt fast alles, glaubt nicht sofort", decisionMakingStyle: "braucht Beweise, misstraut glatten Antworten", patienceLevel: "mittel" },
  { id: "busy", label: "Die Vielbeschäftigte", communicationStyle: "kurz angebunden, will schnell auf den Punkt", decisionMakingStyle: "entscheidet nach Aufwand-Nutzen, keine Zeit für Umwege", patienceLevel: "niedrig" },
  { id: "analytical", label: "Der Analytische", communicationStyle: "sachlich, fragt nach Zahlen und Details", decisionMakingStyle: "rein rational, will Fakten vor Gefühl", patienceLevel: "hoch" },
  { id: "emotional", label: "Die Emotionale", communicationStyle: "spricht offen über Sorgen und Hoffnungen", decisionMakingStyle: "entscheidet aus dem Bauch, reagiert stark auf Empathie", patienceLevel: "mittel" },
  { id: "price_sensitive", label: "Der Preisbewusste", communicationStyle: "vergleicht ständig mit Alternativen", decisionMakingStyle: "Preis-Leistung entscheidet, sehr wertbewusst", patienceLevel: "mittel" },
  { id: "indecisive", label: "Die Unentschlossene", communicationStyle: "zögert, relativiert eigene Aussagen", decisionMakingStyle: "braucht viel Rückversicherung, Angst vor Fehlentscheidung", patienceLevel: "hoch" },
  { id: "dominant", label: "Der Dominante", communicationStyle: "direkt, testet den Verkäufer bewusst", decisionMakingStyle: "will die Kontrolle behalten, entscheidet spontan wenn überzeugt", patienceLevel: "niedrig" },
  { id: "friendly", label: "Die Freundliche", communicationStyle: "offen und nett, plaudert auch mal", decisionMakingStyle: "sympathiegetrieben, aber nicht automatisch kaufbereit", patienceLevel: "hoch" },
  { id: "silent", label: "Der Wortkarge", communicationStyle: "antwortet knapp, muss aktiv herausgefragt werden", decisionMakingStyle: "unklar von außen, entscheidet innerlich, sagt wenig dazu", patienceLevel: "mittel" },
  { id: "overthinker", label: "Die Grüblerin", communicationStyle: "denkt laut, spinnt Konsequenzen weiter", decisionMakingStyle: "durchdenkt jedes Szenario, bevor sie zustimmt", patienceLevel: "hoch" },
  { id: "researcher", label: "Der Rechercheur", communicationStyle: "hat sich vorher informiert, stellt Fachfragen", decisionMakingStyle: "vergleicht mit dem, was er bereits recherchiert hat", patienceLevel: "mittel" },
  { id: "impulsive", label: "Die Spontane", communicationStyle: "schnell, entscheidet aus dem Moment", decisionMakingStyle: "wenn überzeugt, dann sofort — sonst genauso schnell wieder weg", patienceLevel: "niedrig" },
];

const NAMES = [
  "Sabine", "Markus", "Julia", "Thomas", "Nina", "Stefan",
  "Laura", "Michael", "Anja", "Peter", "Katrin", "Daniel",
  "Melanie", "Jonas", "Claudia", "Sven",
];

const AGE_CONTEXTS = [
  "38, arbeitet Vollzeit und hat zwei Kinder",
  "52, selbstständig und sehr eingespannt",
  "29, gerade erste eigene Wohnung, spart aktuell auf vieles",
  "45, hat vor einiger Zeit schon einmal in ein ähnliches Angebot investiert und war enttäuscht",
  "34, pendelt täglich lange und hat wenig Freizeit",
  "60, denkt langsam an den Ruhestand",
  "41, gerade befördert worden, viel um die Ohren",
  "27, erste größere Kaufentscheidung dieser Art",
];

// Private backstory the customer knows but won't volunteer unless the
// seller actually asks good discovery questions — same idea as a hidden
// objection behind the stated one.
const HIDDEN_GOALS = [
  "möchte endlich mehr finanzielle Sicherheit für die Familie",
  "will beruflich einen Schritt weiterkommen, ohne alles umzukrempeln",
  "sucht seit Monaten nach einer Lösung, traut sich aber nicht recht",
  "möchte ein bestehendes Problem endlich loswerden, das schon lange nervt",
  "will etwas verändern, weiß aber nicht genau womit anfangen",
];
const HIDDEN_PAINS = [
  "verliert aktuell regelmäßig Zeit/Geld durch ein ungelöstes Problem",
  "hat das Gefühl, im Moment auf der Stelle zu treten",
  "ist von der aktuellen Situation zunehmend gestresst",
  "hat schon mehrfach versucht, es allein zu lösen, ohne Erfolg",
];
const HIDDEN_PREVIOUS_ATTEMPTS = [
  "hat vor einiger Zeit etwas Ähnliches ausprobiert und war enttäuscht",
  "hat es schon einmal mit einem günstigeren Anbieter versucht — hat nicht funktioniert",
  "hat lange recherchiert, sich aber noch nie wirklich entschieden",
  "hat noch nichts Konkretes probiert, nur viel darüber nachgedacht",
];
const HIDDEN_REAL_CONCERNS = [
  "eigentlich Angst, wieder Geld in etwas zu investieren, das nicht funktioniert",
  "eigentlich unsicher, ob er/sie das selbst durchziehen kann",
  "eigentlich besorgt, was Familie/Partner dazu sagen würde",
  "eigentlich einfach überfordert von der Entscheidung selbst, nicht vom Angebot",
];

function pick<T>(arr: T[], seed: number, salt: number): T {
  return arr[Math.abs((seed + salt * 97) % arr.length)];
}

export function generatePersona(seed: number = Date.now()): CustomerPersona {
  const archetype = pick(ARCHETYPES, seed, 1);
  const name = pick(NAMES, seed, 2);
  const ageContext = pick(AGE_CONTEXTS, seed, 3);
  return {
    name,
    archetype: archetype.label,
    ageContext,
    communicationStyle: archetype.communicationStyle,
    decisionMakingStyle: archetype.decisionMakingStyle,
    patienceLevel: archetype.patienceLevel,
    hiddenGoal: pick(HIDDEN_GOALS, seed, 4),
    hiddenPain: pick(HIDDEN_PAINS, seed, 5),
    hiddenPreviousAttempt: pick(HIDDEN_PREVIOUS_ATTEMPTS, seed, 6),
    hiddenRealConcern: pick(HIDDEN_REAL_CONCERNS, seed, 7),
  };
}

const DIFFICULTY_OFFSET: Record<Difficulty, number> = {
  anfaenger: -18,
  fortgeschritten: 0,
  schwer: 16,
  experte: 30,
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function getInitialEmotionalState(difficulty: Difficulty): CustomerEmotionalState {
  const offset = DIFFICULTY_OFFSET[difficulty];
  return {
    trust: clamp(50 - offset),
    interest: clamp(45 - offset * 0.5),
    skepticism: clamp(40 + offset),
    frustration: clamp(10 + offset * 0.3),
    defensiveness: clamp(30 + offset),
    urgency: clamp(20),
    confusion: clamp(15),
  };
}

/** A single 0-100 "resistance" figure derived from the full emotional
 *  state, used for the simple progress bar in the call UI. */
export function deriveResistance(state: CustomerEmotionalState): number {
  return clamp(
    state.skepticism * 0.3 +
      state.defensiveness * 0.3 +
      state.frustration * 0.25 +
      state.confusion * 0.15 -
      state.trust * 0.35 -
      state.interest * 0.25 +
      45,
  );
}

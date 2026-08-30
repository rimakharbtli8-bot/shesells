import type { TrainingSession } from "@/lib/types";
import { SCORE_DIMENSIONS } from "@/lib/config";

export function getWeakestDimensionLabel(sessions: TrainingSession[]): string {
  if (sessions.length === 0) return "Fragetechnik";
  const averages = SCORE_DIMENSIONS.map((dim) => ({
    label: dim.label,
    value: sessions.reduce((a, s) => a + s.breakdown[dim.key], 0) / sessions.length,
  }));
  return averages.sort((a, b) => a.value - b.value)[0].label;
}

export function answerCoachQuestion(question: string, sessions: TrainingSession[]): string {
  const lastSession = sessions[0];
  const weakest = getWeakestDimensionLabel(sessions);
  const lower = question.toLowerCase();

  if (lower.includes("besser") && lower.includes("reagieren")) {
    if (!lastSession) {
      return "Sobald du dein erstes Training abgeschlossen hast, kann ich dir konkret zeigen, wie du besser reagieren kannst. Starte jetzt ein Training!";
    }
    return `Bei „${lastSession.objectionText ?? "deinem letzten Training"}“ wäre eine offene Frage vor der Argumentation stärker gewesen. Statt direkt zu erklären, frage zuerst: „Was genau macht dir dabei am meisten Sorge?“ — das öffnet das Gespräch, statt es zu schließen.`;
  }

  if (lower.includes("warum") && lower.includes("nicht funktioniert")) {
    if (!lastSession) {
      return "Noch keine Daten vorhanden — trainiere zuerst, dann analysiere ich deine Antwort konkret.";
    }
    return `Deine Antwort im letzten Training hatte vor allem in „${lastSession.feedback.focus}“ noch Potenzial. ${lastSession.feedback.improve[0] ?? ""}`;
  }

  if (lower.includes("welche frage")) {
    return `Eine starke Frage öffnet statt zu schließen: „Was müsste passieren, damit du dir sicher fühlst?“ oder „Worauf genau kommt es dir dabei am meisten an?“. Besonders in deinem aktuellen Fokusbereich (${weakest}) hilft dir das, den Kunden zum Reden zu bringen statt selbst zu argumentieren.`;
  }

  if (lower.includes("trainiere mit mir") || lower.includes("trainiere")) {
    return `Gute Idee. Gehe zu „Trainieren → Einwandtraining“ und wähle den passenden Einwand — ich empfehle dir, gezielt an „${weakest}“ zu arbeiten.`;
  }

  return `Basierend auf deinen bisherigen ${sessions.length} Trainings ist dein aktueller Fokusbereich „${weakest}“. Stell mir gerne eine konkrete Frage zu einem Einwand oder einer Antwort, die du gegeben hast — ich gehe dann genauer darauf ein.`;
}

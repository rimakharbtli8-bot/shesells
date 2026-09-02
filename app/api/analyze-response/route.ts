import { NextResponse } from "next/server";
import { FEATURES } from "@/lib/config";
import { analyzeReply, buildFeedback, overallScore, scoreReply } from "@/lib/ai/scoring";
import { SCORE_MODEL, getClaudeClient } from "@/lib/ai/claudeClient";
import type { ChatMessage, Difficulty, ScoreBreakdown } from "@/lib/types";

const DIMENSION_KEYS = [
  "understanding",
  "questioning",
  "communication",
  "empathy",
  "confidence",
  "structure",
  "concision",
] as const;

const FOCUS_LABELS: Record<string, string> = {
  understanding: "Einwandverständnis",
  questioning: "Fragetechnik",
  communication: "Kommunikation",
  empathy: "Empathie",
  confidence: "Sicherheit im Ton",
  structure: "Gesprächsstruktur",
  concision: "Prägnanz",
};

const SCORE_TOOL = {
  name: "score_reply",
  description: "Bewerte ehrlich und differenziert die Antwort eines Vertriebsmitarbeiters auf einen Kundeneinwand.",
  input_schema: {
    type: "object" as const,
    properties: {
      understanding: { type: "number", description: "0-100: Wie gut hat der Verkäufer den eigentlichen Einwand verstanden und ernst genommen?" },
      questioning: { type: "number", description: "0-100: Fragetechnik — offene Fragen aus echtem Interesse statt sofortiger Argumentation? Gegenfragen nur um 'die Kontrolle zu behalten', ohne den Kunden je wirklich zu beantworten, zählen NICHT als gute Fragetechnik." },
      communication: { type: "number", description: "0-100: Klarheit, Verständlichkeit, Formulierung." },
      empathy: { type: "number", description: "0-100: Einfühlungsvermögen gegenüber der Situation des Kunden — echtes, korrektes Zusammenfassen seiner Aussagen zählt stark positiv; ihn früh auf ein Label festlegen, um ihn später darauf festzunageln, oder seinen Schmerz künstlich dramatisieren zählt negativ." },
      confidence: { type: "number", description: "0-100: Sicherheit im Ton, ohne unnötige Relativierungen wie 'vielleicht'." },
      structure: { type: "number", description: "0-100: Gesprächsstruktur, z.B. erst verstehen, dann vertiefen, dann Perspektive öffnen." },
      concision: { type: "number", description: "0-100: Prägnanz — weder zu knapp/oberflächlich noch ausschweifend." },
      good: {
        type: "array",
        items: { type: "string" },
        description: "1-3 konkrete, kurze Sätze, was der Verkäufer gut gemacht hat — bezogen auf den tatsächlichen Wortlaut, nicht generisch.",
      },
      improve: {
        type: "array",
        items: { type: "string" },
        description: "1-3 konkrete, kurze Sätze, was verbessert werden sollte — bezogen auf den tatsächlichen Wortlaut, nicht generisch.",
      },
      focusDimension: {
        type: "string",
        enum: DIMENSION_KEYS as unknown as string[],
        description: "Die schwächste Dimension, auf die als Nächstes trainiert werden sollte.",
      },
      recommendedExercise: {
        type: "string",
        description: "Eine konkrete, kurze Übungsempfehlung für die nächste Trainingseinheit.",
      },
      questionType: {
        type: "string",
        enum: ["open", "closed", "leading", "clarifying", "emotional", "discovery", "qualification", "none"],
        description: "Art der wichtigsten Frage in der Antwort, falls eine gestellt wurde. 'none' wenn keine Frage gestellt wurde.",
      },
      customerFeltReport: {
        type: "string",
        description:
          "Ein bis zwei Sätze: Was der Kunde bei dieser Antwort WIRKLICH gefühlt hat, jenseits der Oberfläche des Einwands — die 'Truth Layer'-Einschätzung, die dem Verkäufer sonst verborgen bleibt.",
      },
      goldenPath: {
        type: "string",
        description:
          "Wie ein sehr erfahrener Verkäufer an dieser Stelle vorgegangen wäre — als kurzer, nummerierter Denkprozess (1. Was das eigentliche Problem war, 2. welche Information fehlte, 3. welche Frage geholfen hätte, 4. warum). Kein auswendig lernbarer Musterspruch, sondern eine Erklärung des Denkwegs.",
      },
    },
    required: [...DIMENSION_KEYS, "good", "improve", "focusDimension", "recommendedExercise", "questionType", "customerFeltReport", "goldenPath"],
    additionalProperties: false,
  },
  strict: true,
};

const SCORE_SYSTEM_PROMPT = `Du bist ein erfahrener, ehrlicher Sales-Coach, der Antworten aus Einwandbehandlungs-Trainings bewertet. Du siehst dabei mehr als der Verkäufer selbst — auch die Ebene, die im Gespräch nicht ausgesprochen wurde.

Bewerte STRENG und REALISTISCH — nicht generös. Eine kurze, ausweichende oder inhaltsleere Antwort verdient niedrige Werte (unter 40). Eine wirklich starke, konkrete, empathische Antwort mit guter Fragetechnik verdient hohe Werte (80+). Die meisten Antworten sind irgendwo dazwischen und die sieben Dimensionen müssen NICHT alle ähnlich hoch oder niedrig sein — eine Antwort kann z.B. empathisch, aber strukturell schwach sein.

Denke bei "customerFeltReport" in drei Ebenen: Was der Kunde gesagt hat, was er damit vermutlich gemeint hat, und was wahrscheinlich wirklich dahintersteckt (Angst, Unsicherheit, frühere schlechte Erfahrung, Zeitdruck, Überforderung — nicht automatisch das offensichtlichste). Beziehe dich in "good" und "improve" konkret auf das, was der Verkäufer tatsächlich gesagt hat (nicht auf generische Ratschläge). Bewerte ausschließlich über das Tool "score_reply".

Wichtige Unterscheidung, die viele Bewertungen falsch machen: manche Verkaufstechniken WIRKEN geschickt und selbstsicher, sind aber manipulativ statt empathisch — bewerte diese NICHT hoch, auch wenn sie rhetorisch clever sind:
- Den Kunden früh auf ein Label festlegen ("Sie sind also jemand, der X ist") und ihn später erkennbar an dieser eigenen Aussage festnageln, um Druck aufzubauen (Konsistenz-Falle) — das ist Manipulation, keine Gesprächsführung. Niedrige Werte bei "empathy" und "understanding", auch wenn "confidence" hoch wirkt.
- Jede Rückfrage des Kunden nur mit einer Gegenfrage kontern, ohne je wirklich zu antworten, rein um "die Kontrolle zu behalten" — das ist ausweichend, keine gute Fragetechnik. Niedrige Werte bei "questioning", auch wenn ständig Fragen gestellt werden.
- Emotionalen Schmerz des Kunden erkennbar künstlich aufbauschen oder dramatisieren, statt zuzuhören und wirklich zu verstehen — niedrige Werte bei "empathy".
- Bewusst keine hilfreiche, konkrete Information geben, um den Kunden absichtlich abhängig vom Kauf zu machen, statt seine Frage ehrlich zu beantworten — niedrige Werte bei "communication" und "understanding".
Im Gegensatz dazu verdient ECHTES aktives Zuhören hohe Werte: eine Kundenaussage korrekt und aufrichtig zusammenfassen ("Wenn ich dich richtig verstehe, ist eigentlich X dein Hauptproblem, nicht Y?"), dem Kunden dabei die Möglichkeit lassen zu korrigieren, offene Fragen aus echtem Interesse statt aus Kontrollbedürfnis, und ein gutes Rede-Verhältnis (Kunde redet deutlich mehr als der Verkäufer). Der Unterschied zwischen guter und manipulativer Technik liegt in der Absicht dahinter, nicht in der Oberflächenform — beurteile, ob eine Aussage/Frage dem Kunden wirklich Raum gibt oder ihn in eine Richtung drängt.`;

export async function POST(request: Request) {
  const body = await request.json();
  const {
    text,
    difficulty,
    spokenSeconds,
    objectionText,
    transcript,
  }: {
    text: string;
    difficulty: Difficulty;
    spokenSeconds?: number;
    objectionText?: string;
    transcript?: ChatMessage[];
  } = body;

  const client = FEATURES.useRealLLM ? getClaudeClient() : null;

  if (client) {
    try {
      const historyText = (transcript ?? [])
        .map((m) => `${m.role === "user" ? "Verkäufer" : "Kunde"}: ${m.text}`)
        .join("\n");

      const userContent = `Einwand des Kunden: "${objectionText ?? "Allgemeines Verkaufsgespräch"}"
Schwierigkeitsgrad: ${difficulty}
${historyText ? `Bisheriger Gesprächsverlauf:\n${historyText}\n\n` : ""}${spokenSeconds ? `Gesprochene Länge der neuen Antwort: ${spokenSeconds} Sekunden.\n` : ""}Neue Antwort des Verkäufers (wörtlich, das ist die zu bewertende Antwort): "${text}"`;

      const response = await client.messages.create({
        model: SCORE_MODEL,
        max_tokens: 1024,
        system: [{ type: "text", text: SCORE_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        tools: [SCORE_TOOL],
        tool_choice: { type: "tool", name: "score_reply" },
        messages: [{ role: "user", content: userContent }],
      });

      const toolUse = response.content.find((b) => b.type === "tool_use");
      if (toolUse && toolUse.type === "tool_use") {
        const input = toolUse.input as Record<string, unknown>;
        const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
        const breakdown: ScoreBreakdown = {
          understanding: clamp(input.understanding),
          questioning: clamp(input.questioning),
          communication: clamp(input.communication),
          empathy: clamp(input.empathy),
          confidence: clamp(input.confidence),
          structure: clamp(input.structure),
          concision: clamp(input.concision),
        };
        const focusKey = typeof input.focusDimension === "string" ? input.focusDimension : "understanding";
        const analysis = analyzeReply(text, spokenSeconds, objectionText);
        const feedback = {
          good: Array.isArray(input.good) && input.good.length > 0 ? (input.good as string[]) : ["Direkt auf den Einwand reagiert."],
          improve: Array.isArray(input.improve) && input.improve.length > 0 ? (input.improve as string[]) : ["Weiter üben."],
          focus: FOCUS_LABELS[focusKey] ?? "Einwandverständnis",
          recommendedExercise:
            typeof input.recommendedExercise === "string"
              ? input.recommendedExercise
              : `Trainiere gezielt „${FOCUS_LABELS[focusKey] ?? "Einwandverständnis"}“ mit weiteren Einwänden.`,
          customerFeltReport:
            typeof input.customerFeltReport === "string" ? input.customerFeltReport : "Keine Einschätzung verfügbar.",
          goldenPath: typeof input.goldenPath === "string" ? input.goldenPath : "Keine Analyse verfügbar.",
        };

        return NextResponse.json({
          breakdown,
          analysis,
          feedback,
          score: overallScore(breakdown),
          questionType: typeof input.questionType === "string" ? input.questionType : "none",
        });
      }
    } catch (err) {
      console.error("Claude analyze-response call failed, falling back to mock engine:", err);
    }
  }

  // Mock fallback — used when LLM_API_KEY isn't set, or if the real call errors.
  const breakdown = scoreReply(text, difficulty, spokenSeconds, objectionText);
  const analysis = analyzeReply(text, spokenSeconds, objectionText);
  const feedback = buildFeedback(breakdown, analysis, objectionText ?? "diesen Einwand");

  return NextResponse.json({ breakdown, analysis, feedback, score: overallScore(breakdown) });
}

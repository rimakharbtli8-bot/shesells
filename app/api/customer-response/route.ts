import { NextResponse } from "next/server";
import { FEATURES } from "@/lib/config";
import { generateCustomerTurn, getDifficultyTone, getOpeningLine, getStartingResistance } from "@/lib/ai/mockCustomer";
import { getObjectionBySlug } from "@/lib/data/objections";
import { CLAUDE_MODEL, getClaudeClient } from "@/lib/ai/claudeClient";
import type { ChatMessage, Difficulty, TrainingTypeId } from "@/lib/types";

const RESPOND_TOOL = {
  name: "respond_as_customer",
  description: "Antworte als der simulierte Kunde im Verkaufstraining-Telefonat.",
  input_schema: {
    type: "object" as const,
    properties: {
      reply: {
        type: "string",
        description:
          "Was der Kunde als Nächstes am Telefon sagt. Auf Deutsch, 1-3 kurze Sätze, natürlicher gesprochener Ton. Muss explizit und konkret auf das eingehen, was der Verkäufer gerade gesagt hat — kein generischer Standardsatz.",
      },
      resistance: {
        type: "number",
        description:
          "Widerstand/Skepsis des Kunden von 0 (vollständig überzeugt) bis 100 (sehr abweisend), basierend darauf wie gut die letzte Antwort des Verkäufers war.",
      },
      isClosing: {
        type: "boolean",
        description: "true nur, wenn der Kunde jetzt bereit ist zuzustimmen und das Gespräch zum Abschluss zu bringen.",
      },
    },
    required: ["reply", "resistance", "isClosing"],
    additionalProperties: false,
  },
  strict: true,
};

function buildSystemPrompt(trainingType: TrainingTypeId, difficulty: Difficulty, objectionText?: string): string {
  const tone = getDifficultyTone(difficulty);
  const scenario = objectionText
    ? `Der Kunde hat gerade den Einwand geäußert: "${objectionText}". Bleib bei diesem Einwand und eng verwandten Bedenken, bis er entweder überzeugend ausgeräumt wurde oder das Gespräch endet.`
    : `Es handelt sich um ${
        trainingType === "discovery"
          ? "einen Discovery Call, in dem der Verkäufer deinen Bedarf ermitteln will"
          : trainingType === "closing"
            ? "ein Abschlussgespräch"
            : "ein allgemeines Verkaufsgespräch"
      }.`;

  return `Du spielst am Telefon die Rolle eines ${tone} Kunden in einem Verkaufstraining für Vertriebsmitarbeiter. ${scenario}

Wichtige Regeln:
- Reagiere IMMER konkret und explizit auf das, was der Verkäufer gerade gesagt hat — zitiere sinngemäß oder greife sein Argument auf, statt generisch zu antworten.
- Wenn der Verkäufer gut auf deine Bedenken eingeht (Empathie zeigt, gute offene Fragen stellt, konkret und relevant wird), werde nachvollziehbar offener.
- Wenn der Verkäufer schlecht reagiert (deine Sorge ignoriert, vage bleibt, zu schnell argumentiert statt zuzuhören), bleib skeptisch oder werde reservierter — aber bleib realistisch und höflich, nie unmenschlich.
- Wenn der Verkäufer respektlos, beleidigend oder unangemessen wird, reagiere wie ein echter Mensch: irritiert, kühl, kurz angebunden — beende notfalls das Gespräch höflich aber bestimmt (isClosing bleibt dann false, resistance auf 100).
- Sprich wie am echten Telefon: kurze natürliche Sätze, keine Aufzählungen, keine Emojis, kein Verkaufsjargon.
- Antworte ausschließlich über das Tool "respond_as_customer".`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    mode,
    trainingType,
    difficulty,
    objectionSlug,
    userReply,
    resistance,
    turn,
    transcript,
  }: {
    mode: "opening" | "reply";
    trainingType: TrainingTypeId;
    difficulty: Difficulty;
    objectionSlug?: string;
    userReply?: string;
    resistance?: number;
    turn?: number;
    transcript?: ChatMessage[];
  } = body;

  const objection = objectionSlug ? getObjectionBySlug(objectionSlug) : undefined;
  const client = FEATURES.useRealLLM ? getClaudeClient() : null;

  if (client) {
    try {
      const systemPrompt = buildSystemPrompt(trainingType, difficulty, objection?.text);
      // The transcript's very first entry is the customer's own opening
      // line (role "customer" -> mapped to "assistant"). The Anthropic API
      // requires the message array to start with a "user" turn, so a
      // synthetic starter message always leads reply-mode history.
      const history = (transcript ?? [])
        .filter((m) => m.role === "user" || m.role === "customer")
        .map((m) => ({
          role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.text,
        }));

      const messages =
        mode === "reply" && userReply
          ? [
              { role: "user" as const, content: "[Anruf beginnt. Du bist der Kunde.]" },
              ...history,
              {
                role: "user" as const,
                content:
                  resistance != null
                    ? `(Aktueller Widerstand vor dieser Antwort: ${resistance}/100)\n${userReply}`
                    : userReply,
              },
            ]
          : [{ role: "user" as const, content: "[Anruf beginnt. Formuliere deinen ersten Satz als Kunde.]" }];

      const response = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
        tools: [RESPOND_TOOL],
        tool_choice: { type: "tool", name: "respond_as_customer" },
        messages,
      });

      const toolUse = response.content.find((b) => b.type === "tool_use");
      if (toolUse && toolUse.type === "tool_use") {
        const input = toolUse.input as { reply?: string; resistance?: number; isClosing?: boolean };
        if (!input.reply || typeof input.reply !== "string") {
          throw new Error("Claude tool_use response missing 'reply'");
        }
        return NextResponse.json({
          text: input.reply,
          resistance:
            mode === "opening"
              ? getStartingResistance(difficulty)
              : Math.max(0, Math.min(100, Math.round(input.resistance ?? resistance ?? 50))),
          isClosing: mode === "opening" ? false : Boolean(input.isClosing),
          quality: null,
        });
      }
    } catch (err) {
      console.error("Claude customer-response call failed, falling back to mock engine:", err);
    }
  }

  // Mock fallback — used when LLM_API_KEY isn't set, or if the real call errors.
  if (mode === "opening") {
    const text = getOpeningLine(trainingType, difficulty, objection);
    return NextResponse.json({ text, resistance: getStartingResistance(difficulty), isClosing: false, quality: null });
  }

  const result = generateCustomerTurn({
    userReply: userReply ?? "",
    difficulty,
    resistance: resistance ?? 50,
    turn: turn ?? 1,
    objection,
  });

  return NextResponse.json(result);
}

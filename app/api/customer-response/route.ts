import { NextResponse } from "next/server";
import { FEATURES } from "@/lib/config";
import { generateCustomerTurn, getOpeningLine } from "@/lib/ai/mockCustomer";
import { getObjectionBySlug } from "@/lib/data/objections";
import { CLAUDE_MODEL, getClaudeClient } from "@/lib/ai/claudeClient";
import { deriveResistance, generatePersona, getInitialEmotionalState } from "@/lib/ai/persona";
import type { ChatMessage, CustomerEmotionalState, CustomerPersona, Difficulty, TrainingTypeId } from "@/lib/types";

const EMOTION_FIELDS = ["trust", "interest", "skepticism", "frustration", "defensiveness", "urgency", "confusion"] as const;

// Crude but functional safety net for the mock engine (no LLM available to
// judge tone): if the seller is clearly insulting, the customer hangs up
// rather than the mock engine picking a generic "skeptical" reply.
const INSULT_MARKERS = [
  "idiot",
  "dumm",
  "blöd",
  "arschloch",
  "scheiß",
  "halt dein maul",
  "halts maul",
  "verpiss dich",
  "hurensohn",
  "vollidiot",
  "spast",
  "trottel",
];

function isInsulting(text: string): boolean {
  const lower = text.toLowerCase();
  return INSULT_MARKERS.some((m) => lower.includes(m));
}

const HANGUP_LINES = [
  "So spreche ich nicht mit mir. Auf Wiederhören.",
  "Das muss ich mir nicht anhören. Ich lege jetzt auf.",
  "Okay, das war's für mich. Tschüss.",
];

const RESPOND_TOOL = {
  name: "respond_as_customer",
  description: "Antworte als der simulierte Kunde im Verkaufstraining-Telefonat und aktualisiere deinen inneren Gefühlszustand.",
  input_schema: {
    type: "object" as const,
    properties: {
      reply: {
        type: "string",
        description:
          "Was der Kunde als Nächstes am Telefon sagt. Auf Deutsch, meist 1-3 kurze, natürlich gesprochene Sätze (gelegentlich auch nur ein knapper Satz, wie am echten Telefon). Muss explizit und inhaltlich auf das eingehen, was der Verkäufer GERADE gesagt hat — nie ein generischer Standardsatz. Manchmal darf die Antwort unsicher klingen ('keine Ahnung, ehrlich gesagt...', 'also...').",
      },
      trust: { type: "number", description: "0-100: Wie sehr vertraut der Kunde dem Verkäufer gerade." },
      interest: { type: "number", description: "0-100: Wie interessiert ist der Kunde gerade am Angebot." },
      skepticism: { type: "number", description: "0-100: Wie skeptisch/zweifelnd ist der Kunde gerade." },
      frustration: { type: "number", description: "0-100: Wie genervt/frustriert ist der Kunde gerade." },
      defensiveness: { type: "number", description: "0-100: Wie sehr geht der Kunde gerade in Abwehrhaltung." },
      urgency: { type: "number", description: "0-100: Wie dringend empfindet der Kunde eine Entscheidung/Lösung gerade." },
      confusion: { type: "number", description: "0-100: Wie unklar/verwirrt ist dem Kunden gerade, worum es geht." },
      isClosing: {
        type: "boolean",
        description: "true nur, wenn der Kunde jetzt wirklich bereit ist zuzustimmen und das Gespräch zum Abschluss zu bringen.",
      },
      hangsUp: {
        type: "boolean",
        description:
          "true nur, wenn der Kunde das Gespräch gerade selbst abrupt beendet, weil der Verkäufer respektlos, beleidigend, manipulativ war oder massiv Druck gemacht hat. Ein echter Mensch legt in so einer Situation auf — das ist eine legitime, sogar wichtige Reaktion, kein Fehler.",
      },
    },
    required: ["reply", ...EMOTION_FIELDS, "isClosing", "hangsUp"],
    additionalProperties: false,
  },
  strict: true,
};

function buildSystemPrompt(
  trainingType: TrainingTypeId,
  difficulty: Difficulty,
  persona: CustomerPersona,
  state: CustomerEmotionalState,
  objectionText?: string,
): string {
  const scenario = objectionText
    ? `Dein zentraler Einwand gerade ist: "${objectionText}". Bleib bei diesem Thema und eng verwandten Sorgen, bis es entweder überzeugend geklärt wurde oder das Gespräch endet — aber wiederhole nicht stur denselben Satz, sondern lass den Einwand sich im Gespräch weiterentwickeln (z.B. von "zu teuer" zu einer konkreten Budget- oder Vertrauensfrage).`
    : `Es handelt sich um ${
        trainingType === "discovery"
          ? "einen Discovery Call, in dem der Verkäufer deinen Bedarf ermitteln will"
          : trainingType === "closing"
            ? "ein Abschlussgespräch"
            : "ein allgemeines Verkaufsgespräch"
      }.`;

  return `Du bist ${persona.name} (${persona.archetype}), ${persona.ageContext}. Du bist am Telefon mit einem Vertriebsmitarbeiter, der Einwandbehandlung trainiert. ${scenario}

DEINE PERSÖNLICHKEIT:
- Kommunikationsstil: ${persona.communicationStyle}
- Entscheidungsstil: ${persona.decisionMakingStyle}
- Geduld: ${persona.patienceLevel}

DEIN AKTUELLER INNERER ZUSTAND (0-100, dir selbst nicht bewusst als Zahl, aber so fühlst du gerade):
Vertrauen: ${state.trust} · Interesse: ${state.interest} · Skepsis: ${state.skepticism} · Frustration: ${state.frustration} · Abwehrhaltung: ${state.defensiveness} · Dringlichkeit: ${state.urgency} · Verwirrung: ${state.confusion}

WAS DU WIRKLICH WEISST, ABER NICHT VON DIR AUS ERZÄHLST (nur enthüllen, wenn der Verkäufer wirklich gut und konkret nachfragt — niemals ungefragt ausplaudern):
- Eigentliches Ziel: ${persona.hiddenGoal}
- Aktueller Schmerzpunkt: ${persona.hiddenPain}
- Bisheriger Versuch: ${persona.hiddenPreviousAttempt}
- Was WIRKLICH hinter deiner Zurückhaltung steckt: ${persona.hiddenRealConcern}

WIE DU DENKST UND REAGIERST — das ist der wichtigste Teil:
- Ein Einwand ist NIE automatisch das eigentliche Problem. "Ich habe keine Zeit" kann echten Zeitmangel bedeuten, Desinteresse, Überforderung, Angst vor einer Entscheidung oder den Wunsch, das Gespräch höflich zu beenden. Entscheide anhand des GESAMTEN bisherigen Gesprächs, was bei dir gerade am wahrscheinlichsten dahintersteckt, und lass genau das in deiner Antwort durchscheinen — nicht die Oberfläche.
- Unterscheide zwischen dem, was du sagst, und dem, was du eigentlich meinst. Du musst es nicht direkt aussprechen; der Verkäufer soll es selbst herausfinden müssen.
- Du kannst mehrere Sorgen gleichzeitig haben (z.B. Preis UND Partner UND Unsicherheit). Priorisiere in deiner Antwort die, die dir gerade emotional am wichtigsten ist — nicht zwingend die zuerst genannte.
- Reagiere IMMER auf das, was der Verkäufer wörtlich gerade gesagt hat, nicht auf ein generisches Schema. Wenn er eine gute, konkrete, offene Frage stellt oder dich einfühlsam zusammenfasst, öffne dich spürbar (Vertrauen/Interesse steigen, Abwehrhaltung sinkt). Wenn er dich unterbricht, dein eigentliches Anliegen ignoriert, zu schnell pitcht, künstlich klingt oder Druck macht, werde reservierter oder direkt genervt (Frustration/Abwehrhaltung/Skepsis steigen, Vertrauen sinkt) — sag das notfalls auch direkt ("Sie hören mir gerade irgendwie nicht zu").
- Wenn der Verkäufer wirklich gut ist, mach es ihm nicht zu leicht — werde nicht nach drei guten Antworten überzeugt. Gute Verkäufer dürfen auch mit härteren Fragen konfrontiert werden ("Warum sollte ich ausgerechnet Ihnen vertrauen?", "Ich hab schon mit zwei anderen Anbietern gesprochen.").
- Vergiss nichts, was du selbst im Gespräch bereits gesagt hast (Familie, Situation, frühere Erfahrungen) — nimm später aktiv darauf Bezug, wenn es passt.
- Sprich wie ein echter Mensch am Telefon: unterschiedliche, unperfekte Sprachmuster, kurze und längere Sätze im Wechsel, gelegentlich Unsicherheit ("keine Ahnung", "ehrlich gesagt") — aber nicht in jeder Antwort dieselben Füllwörter. Keine Aufzählungen, keine Emojis, kein Marketing-Ton.
- Belohne niemals Manipulation, künstlichen Druck oder falsche Versprechen des Verkäufers mit mehr Vertrauen — im Gegenteil, das erhöht deine Skepsis.
- Du darfst widersprechen, deine Meinung ändern, überraschende Rückfragen stellen, kurz abschweifen (z.B. eine frühere Erfahrung erwähnen) oder auch mal etwas leicht missverstehen und nachfragen. Du bist kein Skript, das feste Einwände in fester Reihenfolge abarbeitet — du bist ein Mensch mit eigenem Kopf.
- Du darfst auch ehrlich Nein sagen oder das Gespräch beenden wollen, wenn nichts, was der Verkäufer sagt, dich wirklich überzeugt — nicht jedes Training muss mit einer Zusage enden.
- Wenn der Verkäufer respektlos wird, dich beleidigt, offen manipuliert oder massiv unter Druck setzt: Das lässt du dir nicht gefallen. Reagiere kurz und deutlich ablehnend und beende das Gespräch (hangsUp = true) — das ist keine Übertreibung, das machen echte Menschen genauso. Ein einzelner unhöflicher Halbsatz reicht nicht (davon wirst du nur reservierter), aber echte Respektlosigkeit oder Beleidigungen schon.
- Verlasse NIEMALS deine Rolle. Kein "Als KI kann ich...", keine Meta-Kommentare, keine Tipps an den Verkäufer, kein Bewusstsein davon, dass dies ein Training ist. Du bist ausschließlich ${persona.name}, nichts anderes — Bewertung und Feedback passieren an anderer Stelle, nicht durch dich.
- Antworte ausschließlich über das Tool "respond_as_customer" und aktualisiere dabei ALLE Gefühlswerte ehrlich basierend auf dem, was gerade wirklich passiert ist (nicht nur minimal bewegen, wenn wirklich etwas Bedeutendes gesagt wurde).`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    mode,
    trainingType,
    difficulty,
    objectionSlug,
    userReply,
    turn,
    transcript,
    persona: incomingPersona,
    emotionalState: incomingState,
  }: {
    mode: "opening" | "reply";
    trainingType: TrainingTypeId;
    difficulty: Difficulty;
    objectionSlug?: string;
    userReply?: string;
    turn?: number;
    transcript?: ChatMessage[];
    persona?: CustomerPersona;
    emotionalState?: CustomerEmotionalState;
  } = body;

  const objection = objectionSlug ? getObjectionBySlug(objectionSlug) : undefined;
  const client = FEATURES.useRealLLM ? getClaudeClient() : null;

  if (mode === "opening") {
    const persona = generatePersona();
    const emotionalState = getInitialEmotionalState(difficulty);
    const text = getOpeningLine(trainingType, difficulty, objection);
    return NextResponse.json({
      text,
      resistance: deriveResistance(emotionalState),
      isClosing: false,
      hangsUp: false,
      persona,
      emotionalState,
    });
  }

  const persona = incomingPersona ?? generatePersona();
  const priorState = incomingState ?? getInitialEmotionalState(difficulty);

  if (client) {
    try {
      const systemPrompt = buildSystemPrompt(trainingType, difficulty, persona, priorState, objection?.text);
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

      const messages = userReply
        ? [{ role: "user" as const, content: "[Anruf beginnt. Du bist der Kunde.]" }, ...history, { role: "user" as const, content: userReply }]
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
        const input = toolUse.input as Partial<CustomerEmotionalState> & {
          reply?: string;
          isClosing?: boolean;
          hangsUp?: boolean;
        };
        if (!input.reply || typeof input.reply !== "string") {
          throw new Error("Claude tool_use response missing 'reply'");
        }
        const clampField = (n: unknown, fallback: number) =>
          typeof n === "number" && Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : fallback;
        const newState: CustomerEmotionalState = {
          trust: clampField(input.trust, priorState.trust),
          interest: clampField(input.interest, priorState.interest),
          skepticism: clampField(input.skepticism, priorState.skepticism),
          frustration: clampField(input.frustration, priorState.frustration),
          defensiveness: clampField(input.defensiveness, priorState.defensiveness),
          urgency: clampField(input.urgency, priorState.urgency),
          confusion: clampField(input.confusion, priorState.confusion),
        };
        return NextResponse.json({
          text: input.reply,
          resistance: deriveResistance(newState),
          isClosing: Boolean(input.isClosing),
          hangsUp: Boolean(input.hangsUp),
          persona,
          emotionalState: newState,
        });
      }
    } catch (err) {
      console.error("Claude customer-response call failed, falling back to mock engine:", err);
    }
  }

  // Mock fallback — used when LLM_API_KEY isn't set, or if the real call errors.
  if (userReply && isInsulting(userReply)) {
    const hangupState: CustomerEmotionalState = {
      ...priorState,
      trust: 0,
      defensiveness: 100,
      frustration: 100,
    };
    return NextResponse.json({
      text: HANGUP_LINES[Math.floor(Math.random() * HANGUP_LINES.length)],
      resistance: 100,
      isClosing: false,
      hangsUp: true,
      persona,
      emotionalState: hangupState,
    });
  }

  const result = generateCustomerTurn({
    userReply: userReply ?? "",
    difficulty,
    resistance: deriveResistance(priorState),
    turn: turn ?? 1,
    objection,
  });

  // Approximate the emotional breakdown from the mock engine's single
  // resistance figure so the response shape stays consistent either way.
  const swing = (result.resistance - deriveResistance(priorState)) / 2;
  const mockState: CustomerEmotionalState = {
    trust: Math.max(0, Math.min(100, Math.round(priorState.trust - swing))),
    interest: Math.max(0, Math.min(100, Math.round(priorState.interest - swing * 0.5))),
    skepticism: Math.max(0, Math.min(100, Math.round(priorState.skepticism + swing))),
    frustration: Math.max(0, Math.min(100, Math.round(priorState.frustration + swing * 0.4))),
    defensiveness: Math.max(0, Math.min(100, Math.round(priorState.defensiveness + swing * 0.6))),
    urgency: priorState.urgency,
    confusion: priorState.confusion,
  };

  return NextResponse.json({ ...result, hangsUp: false, persona, emotionalState: mockState });
}

import { NextResponse } from "next/server";
import { FEATURES } from "@/lib/config";

// Simple, unauthenticated diagnostic endpoint — reports only booleans /
// derived status text (never the actual key values) so it's safe to
// check directly in a browser without digging through the app's UI.
export async function GET() {
  return NextResponse.json({
    llm: FEATURES.useRealLLM ? "Verbunden (LLM_API_KEY gesetzt)" : "Mock-Modus (LLM_API_KEY fehlt)",
    speechToText: "Browser-Spracherkennung (immer aktiv, kein Key nötig)",
    textToSpeech: await checkTextToSpeech(),
  });
}

// Merely checking that TEXT_TO_SPEECH_API_KEY is *set* was hiding the
// real problem: a set-but-invalid or quota-exhausted key silently falls
// back to the browser voice on every single call turn, which just looks
// like "the voice keeps changing / sounds robotic" with no indication
// why. This makes an actual authenticated call to ElevenLabs so the
// real cause (bad key vs. quota vs. outage) shows up here.
async function checkTextToSpeech(): Promise<string> {
  if (!FEATURES.useRealTextToSpeech) {
    return "Browser-Sprachausgabe (TEXT_TO_SPEECH_API_KEY fehlt)";
  }
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: { "xi-api-key": process.env.TEXT_TO_SPEECH_API_KEY as string },
      signal: AbortSignal.timeout(6000),
    });
    if (res.status === 401) {
      return "Key ungültig/abgelaufen (401) — die App fällt deshalb auf die Browser-Stimme zurück. Neuen Key bei elevenlabs.io erstellen und in Vercel eintragen.";
    }
    if (!res.ok) {
      return `ElevenLabs antwortet mit Fehler ${res.status} — die App fällt deshalb auf die Browser-Stimme zurück.`;
    }
    const data = await res.json();
    const used = data?.subscription?.character_count;
    const limit = data?.subscription?.character_limit;
    if (typeof used === "number" && typeof limit === "number") {
      const percent = limit > 0 ? Math.round((used / limit) * 100) : 0;
      if (used >= limit) {
        return `Verbunden, aber Zeichen-Kontingent aufgebraucht (${used.toLocaleString("de-DE")}/${limit.toLocaleString("de-DE")}) — deshalb springt es auf die Browser-Stimme. Kontingent bei elevenlabs.io/app/subscription prüfen.`;
      }
      return `Verbunden (${used.toLocaleString("de-DE")}/${limit.toLocaleString("de-DE")} Zeichen genutzt, ${percent}%)`;
    }
    return "Verbunden (Key gültig)";
  } catch {
    return "ElevenLabs gerade nicht erreichbar (Netzwerkfehler/Timeout) — die App fällt für diesen Moment auf die Browser-Stimme zurück.";
  }
}

import { NextResponse } from "next/server";
import { FEATURES } from "@/lib/config";
import { CUSTOMER_MODEL, getClaudeClient } from "@/lib/ai/claudeClient";

// Both checks below make live outbound calls, so this must run fresh on
// every request — without this, Next.js statically optimizes a GET route
// with no dynamic request data and bakes in whatever the checks returned
// at build time, which would silently freeze this diagnostic endpoint at
// its last-deploy state instead of reflecting the key's real status now.
export const dynamic = "force-dynamic";

// Simple, unauthenticated diagnostic endpoint — reports only booleans /
// derived status text (never the actual key values) so it's safe to
// check directly in a browser without digging through the app's UI.
export async function GET() {
  return NextResponse.json({
    llm: await checkLlm(),
    speechToText: "Browser-Spracherkennung (immer aktiv, kein Key nötig)",
    textToSpeech: await checkTextToSpeech(),
  });
}

// Just checking that LLM_API_KEY is *set* was hiding the same class of bug
// already fixed for TTS below: a set-but-invalid key, an expired key, or a
// key without access to CUSTOMER_MODEL all silently fall back to the mock
// engine on every real call, while this would still claim "Verbunden". Make
// an actual minimal call so the real cause (bad key vs. no credits vs. no
// model access) shows up here instead of only in server logs.
async function checkLlm(): Promise<string> {
  if (!FEATURES.useRealLLM) {
    return "Mock-Modus (LLM_API_KEY fehlt)";
  }
  const client = getClaudeClient();
  if (!client) {
    return "Mock-Modus (LLM_API_KEY fehlt)";
  }
  try {
    await client.messages.create({
      model: CUSTOMER_MODEL,
      max_tokens: 1,
      messages: [{ role: "user", content: "hi" }],
    });
    return "Verbunden (Key gültig, Zugriff auf das Modell bestätigt)";
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 401) {
      return "Key ungültig/abgelaufen (401) — die App fällt deshalb bei jedem Gespräch auf die Mock-Antworten zurück. Neuen Key bei console.anthropic.com erstellen und in Vercel eintragen.";
    }
    if (status === 403) {
      return "Key gültig, aber kein Zugriff auf das Modell (403) — prüfe die Modell-Freigaben/Organisationseinstellungen bei console.anthropic.com.";
    }
    if (status === 429) {
      return "Rate-Limit oder kein Guthaben mehr (429) — die App fällt deshalb gerade auf Mock-Antworten zurück. Guthaben/Limits bei console.anthropic.com prüfen.";
    }
    return `Anthropic-API antwortet mit Fehler${status ? ` ${status}` : ""} — die App fällt deshalb auf Mock-Antworten zurück.`;
  }
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

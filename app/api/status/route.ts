import { NextResponse } from "next/server";
import { FEATURES } from "@/lib/config";

// Simple, unauthenticated diagnostic endpoint — reports only booleans
// (never the actual key values) so it's safe to check directly in a
// browser without digging through the app's UI.
export async function GET() {
  return NextResponse.json({
    llm: FEATURES.useRealLLM ? "Verbunden (LLM_API_KEY gesetzt)" : "Mock-Modus (LLM_API_KEY fehlt)",
    speechToText: "Browser-Spracherkennung (immer aktiv, kein Key nötig)",
    textToSpeech: FEATURES.useRealTextToSpeech
      ? "Verbunden (TEXT_TO_SPEECH_API_KEY gesetzt)"
      : "Browser-Sprachausgabe (TEXT_TO_SPEECH_API_KEY fehlt)",
  });
}

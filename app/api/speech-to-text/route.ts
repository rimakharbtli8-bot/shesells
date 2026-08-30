import { NextResponse } from "next/server";
import { FEATURES } from "@/lib/config";

// SPEECH_TO_TEXT_API_KEY stays server-only. The client currently transcribes
// voice answers locally via the browser's Web Speech API (see
// lib/hooks/useVoiceRecorder.ts), so this route is not called yet — it's
// the drop-in target once a cloud STT provider (e.g. for higher accuracy or
// unsupported browsers) is connected.
const SPEECH_TO_TEXT_API_KEY = process.env.SPEECH_TO_TEXT_API_KEY;

export async function POST(request: Request) {
  if (!FEATURES.useRealSpeechToText || !SPEECH_TO_TEXT_API_KEY) {
    return NextResponse.json(
      { error: "Kein Speech-to-Text-Provider konfiguriert. Nutze die Browser-Spracherkennung." },
      { status: 501 },
    );
  }

  // TODO: forward request body (audio) to the real STT provider using
  // SPEECH_TO_TEXT_API_KEY and return { transcript: string }.
  return NextResponse.json({ error: "Nicht implementiert." }, { status: 501 });
}

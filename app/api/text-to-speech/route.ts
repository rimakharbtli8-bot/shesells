import { NextResponse } from "next/server";
import { FEATURES } from "@/lib/config";

// TEXT_TO_SPEECH_API_KEY stays server-only. The client currently uses the
// browser's built-in speechSynthesis API to auto-play the customer's lines
// during the call (see lib/hooks/useCallTts.ts), so this route is not
// called yet — it's the drop-in target once a cloud TTS provider (for a
// genuinely realistic customer voice) is connected.
const TEXT_TO_SPEECH_API_KEY = process.env.TEXT_TO_SPEECH_API_KEY;

export async function POST(request: Request) {
  if (!FEATURES.useRealTextToSpeech || !TEXT_TO_SPEECH_API_KEY) {
    return NextResponse.json(
      { error: "Kein Text-to-Speech-Provider konfiguriert. Nutze die Browser-Sprachausgabe." },
      { status: 501 },
    );
  }

  // TODO: forward request body { text } to the real TTS provider using
  // TEXT_TO_SPEECH_API_KEY and return an audio stream / URL.
  return NextResponse.json({ error: "Nicht implementiert." }, { status: 501 });
}

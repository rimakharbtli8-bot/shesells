import { NextResponse } from "next/server";
import { FEATURES } from "@/lib/config";

// TEXT_TO_SPEECH_API_KEY stays server-only — this route proxies to
// ElevenLabs so the key never reaches the browser. The client
// (lib/hooks/useCallTts.ts) always tries this route first and falls back
// to the browser's built-in speechSynthesis when no key is configured or
// the request fails.
const TEXT_TO_SPEECH_API_KEY = process.env.TEXT_TO_SPEECH_API_KEY;
// "Rachel" — an ElevenLabs premade voice that works well with the
// multilingual model. Override with your own cloned/premade voice id.
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

export async function POST(request: Request) {
  if (!FEATURES.useRealTextToSpeech || !TEXT_TO_SPEECH_API_KEY) {
    return NextResponse.json(
      { error: "Kein Text-to-Speech-Provider konfiguriert. Nutze die Browser-Sprachausgabe." },
      { status: 501 },
    );
  }

  const { text } = await request.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Kein Text übergeben." }, { status: 400 });
  }

  try {
    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: "POST",
      headers: {
        "xi-api-key": TEXT_TO_SPEECH_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.45, similarity_boost: 0.8 },
      }),
    });

    if (!elevenRes.ok) {
      const errBody = await elevenRes.text();
      console.error("ElevenLabs TTS request failed:", elevenRes.status, errBody);
      return NextResponse.json({ error: "TTS-Anfrage fehlgeschlagen." }, { status: 502 });
    }

    const audioBuffer = await elevenRes.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("ElevenLabs TTS call failed:", err);
    return NextResponse.json({ error: "TTS-Anfrage fehlgeschlagen." }, { status: 502 });
  }
}

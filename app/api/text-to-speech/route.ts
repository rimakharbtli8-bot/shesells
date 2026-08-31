import { NextResponse } from "next/server";
import { FEATURES } from "@/lib/config";

// TEXT_TO_SPEECH_API_KEY stays server-only — this route proxies to
// ElevenLabs so the key never reaches the browser. The client
// (lib/hooks/useCallTts.ts) always tries this route first and falls back
// to the browser's built-in speechSynthesis when no key is configured or
// the request fails.
const TEXT_TO_SPEECH_API_KEY = process.env.TEXT_TO_SPEECH_API_KEY;
// Well-known ElevenLabs premade voices that work well with the
// multilingual model — "Rachel" (female) and "Adam" (male). Override
// either with your own cloned/premade voice id.
const ELEVENLABS_VOICE_ID_FEMALE = process.env.ELEVENLABS_VOICE_ID_FEMALE || process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
const ELEVENLABS_VOICE_ID_MALE = process.env.ELEVENLABS_VOICE_ID_MALE || "pNInz6obpgDQGcFmaJgB";

export async function POST(request: Request) {
  if (!FEATURES.useRealTextToSpeech || !TEXT_TO_SPEECH_API_KEY) {
    return NextResponse.json(
      { error: "Kein Text-to-Speech-Provider konfiguriert. Nutze die Browser-Sprachausgabe." },
      { status: 501 },
    );
  }

  const { text, gender } = await request.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Kein Text übergeben." }, { status: 400 });
  }
  const voiceId = gender === "male" ? ELEVENLABS_VOICE_ID_MALE : ELEVENLABS_VOICE_ID_FEMALE;

  try {
    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": TEXT_TO_SPEECH_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        // Low stability + no style reads as flat/robotic; a bit more style
        // and speaker boost gives noticeably more natural, human prosody.
        voice_settings: { stability: 0.5, similarity_boost: 0.85, style: 0.35, use_speaker_boost: true },
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

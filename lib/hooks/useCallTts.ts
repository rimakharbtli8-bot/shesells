"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CustomerPersona } from "@/lib/types";

// The Web Speech API has no standard "gender" field on voices, so this is
// a best-effort name match against common German voice names across
// browsers/OSes. Falls back to any available German voice either way.
const FEMALE_NAME_HINTS = /anna|helena|hedda|katja|petra|female|frau|women/i;
const MALE_NAME_HINTS = /stefan|markus|yannick|male|mann|men\b/i;

/**
 * Plays the customer's lines during a call. Always tries the server's real
 * TTS route first (ElevenLabs, once TEXT_TO_SPEECH_API_KEY is configured —
 * see app/api/text-to-speech/route.ts) and transparently falls back to the
 * browser's built-in speechSynthesis (noticeably synthetic, but always
 * available) when no provider is configured or the request fails. Picks a
 * voice matching the customer persona's gender where possible.
 */
export function useCallTts() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const germanVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const browserTtsSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!browserTtsSupported) return;

    const loadVoices = () => {
      germanVoicesRef.current = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("de"));
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [browserTtsSupported]);

  const pickBrowserVoice = (gender?: CustomerPersona["gender"]): SpeechSynthesisVoice | null => {
    const german = germanVoicesRef.current;
    if (german.length === 0) return null;
    const hint = gender === "male" ? MALE_NAME_HINTS : gender === "female" ? FEMALE_NAME_HINTS : null;
    const byGender = hint ? german.find((v) => hint.test(v.name)) : undefined;
    const byQuality = german.find((v) => /natural|enhanced|premium|neural/i.test(v.name));
    return byGender ?? byQuality ?? german[0];
  };

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onplay = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const speakWithBrowser = useCallback(
    (text: string, gender: CustomerPersona["gender"] | undefined, onEnd?: () => void) => {
      if (!browserTtsSupported) {
        onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "de-DE";
      const voice = pickBrowserVoice(gender);
      if (voice) utterance.voice = voice;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        onEnd?.();
      };
      window.speechSynthesis.speak(utterance);
    },
    [browserTtsSupported],
  );

  const speak = useCallback(
    async (text: string, onEnd?: () => void, gender?: CustomerPersona["gender"]) => {
      cleanupAudio();
      try {
        const res = await fetch("/api/text-to-speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, gender }),
        });
        if (!res.ok) throw new Error("tts-unavailable");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          cleanupAudio();
          onEnd?.();
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          cleanupAudio();
          speakWithBrowser(text, gender, onEnd);
        };
        await audio.play();
      } catch {
        speakWithBrowser(text, gender, onEnd);
      }
    },
    [cleanupAudio, speakWithBrowser],
  );

  const cancel = useCallback(() => {
    cleanupAudio();
    if (browserTtsSupported) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [cleanupAudio, browserTtsSupported]);

  useEffect(() => cancel, [cancel]);

  return { isSpeaking, speak, cancel };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Plays the customer's lines during a call. Always tries the server's real
 * TTS route first (ElevenLabs, once TEXT_TO_SPEECH_API_KEY is configured —
 * see app/api/text-to-speech/route.ts) and transparently falls back to the
 * browser's built-in speechSynthesis (noticeably synthetic, but always
 * available) when no provider is configured or the request fails.
 */
export function useCallTts() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const browserTtsSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!browserTtsSupported) return;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const german = voices.filter((v) => v.lang.toLowerCase().startsWith("de"));
      const preferred =
        german.find((v) => /natural|enhanced|premium|neural/i.test(v.name)) ||
        german.find((v) => /google/i.test(v.name)) ||
        german[0];
      voiceRef.current = preferred ?? voices[0] ?? null;
    };

    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
  }, [browserTtsSupported]);

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
    (text: string, onEnd?: () => void) => {
      if (!browserTtsSupported) {
        onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "de-DE";
      if (voiceRef.current) utterance.voice = voiceRef.current;
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
    async (text: string, onEnd?: () => void) => {
      cleanupAudio();
      try {
        const res = await fetch("/api/text-to-speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
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
          speakWithBrowser(text, onEnd);
        };
        await audio.play();
      } catch {
        speakWithBrowser(text, onEnd);
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

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Wraps the browser's speechSynthesis API and picks the most natural
 * German voice available. This is a stand-in for a real TTS provider —
 * see app/api/text-to-speech/route.ts, which takes over automatically
 * once TEXT_TO_SPEECH_API_KEY is configured. Browser voices are decent
 * but noticeably synthetic; a real provider sounds far more human.
 */
export function useCallTts() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!isSupported) return;

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
  }, [isSupported]);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!isSupported) {
        onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "de-DE";
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.rate = 1;
      utterance.pitch = 1;
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
    [isSupported],
  );

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  useEffect(() => cancel, [cancel]);

  return { isSupported, isSpeaking, speak, cancel };
}

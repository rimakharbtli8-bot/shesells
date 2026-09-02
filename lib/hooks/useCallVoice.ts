"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Mikrofon-Zugriff wurde verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.",
  "permission-denied": "Mikrofon-Zugriff wurde verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.",
  "audio-capture": "Kein Mikrofon gefunden. Prüfe deine Geräteeinstellungen.",
  network: "Netzwerkfehler bei der Spracherkennung. Bitte versuch es erneut.",
  "service-not-allowed": "Spracherkennung ist in diesem Browser/Kontext blockiert.",
};

const SILENCE_MS = 1400;

// Errors that mean voice input plain won't work this session (permission
// denied, no mic hardware, blocked by browser/OS policy) — retrying just
// repeats the same failure. "network" and "no-speech" are transient and
// worth restarting for; anything in this set should stop and let the
// caller fall back to typed input instead.
const UNRECOVERABLE_ERRORS = new Set(["not-allowed", "permission-denied", "audio-capture", "service-not-allowed"]);

interface UseCallVoiceOptions {
  /** Fires once the caller has paused for SILENCE_MS after saying something. */
  onUtterance: (text: string, seconds: number) => void;
  enabled: boolean;
}

interface UseCallVoiceResult {
  isSupported: boolean;
  isListening: boolean;
  liveText: string;
  error: string | null;
  start: () => void;
  stop: () => void;
}

/**
 * Continuous, hands-free speech capture for the call screen: no manual
 * record/stop — the caller just talks, and after a short pause the
 * accumulated utterance is handed off automatically.
 */
export function useCallVoice({ onUtterance, enabled }: UseCallVoiceOptions): UseCallVoiceResult {
  const [isListening, setIsListening] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTextRef = useRef("");
  const startTimeRef = useRef(0);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalStopRef = useRef(false);
  const onUtteranceRef = useRef(onUtterance);
  onUtteranceRef.current = onUtterance;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const isSupported =
    typeof window !== "undefined" &&
    Boolean((window as WindowWithSpeech).SpeechRecognition || (window as WindowWithSpeech).webkitSpeechRecognition);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const start = useCallback(() => {
    if (!isSupported || recognitionRef.current) return;
    const SpeechRecognitionCtor =
      (window as WindowWithSpeech).SpeechRecognition || (window as WindowWithSpeech).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    setError(null);
    finalTextRef.current = "";
    setLiveText("");
    startTimeRef.current = Date.now();
    intentionalStopRef.current = false;

    let recognition: SpeechRecognitionLike;
    try {
      recognition = new SpeechRecognitionCtor();
    } catch {
      setError("Spracherkennung konnte nicht gestartet werden.");
      return;
    }

    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTextRef.current += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      setLiveText((finalTextRef.current + interim).trim());

      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        const text = finalTextRef.current.trim();
        if (text) {
          const seconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
          intentionalStopRef.current = true;
          recognitionRef.current?.stop();
          onUtteranceRef.current(text, seconds);
        }
      }, SILENCE_MS);
    };

    recognition.onerror = (event) => {
      const code = event?.error;
      if (code && code !== "aborted" && code !== "no-speech") {
        setError(ERROR_MESSAGES[code] ?? `Fehler bei der Spracherkennung (${code}).`);
      }
      if (code && UNRECOVERABLE_ERRORS.has(code)) {
        // Without this, onend below sees enabled+not-intentionally-stopped
        // and immediately calls start() again — which fails with the same
        // error again, forever. Mark it as if we'd stopped it ourselves so
        // the caller's typed-fallback input is the way forward instead.
        intentionalStopRef.current = true;
      }
    };

    recognition.onend = () => {
      clearSilenceTimer();
      setIsListening(false);
      recognitionRef.current = null;
      // Browsers can end recognition on their own (long silence, internal
      // timeout). If we didn't stop it ourselves and the call is still
      // active, keep the mic hands-free by restarting automatically.
      if (!intentionalStopRef.current && enabledRef.current) {
        start();
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setError("Spracherkennung konnte nicht gestartet werden.");
      recognitionRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);

  const stop = useCallback(() => {
    intentionalStopRef.current = true;
    clearSilenceTimer();
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  useEffect(() => stop, [stop]);

  return { isSupported, isListening, liveText, error, start, stop };
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

interface WindowWithSpeech {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
}

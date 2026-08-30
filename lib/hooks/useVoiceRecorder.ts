"use client";

import { useCallback, useRef, useState } from "react";

interface UseVoiceRecorderResult {
  isSupported: boolean;
  isRecording: boolean;
  start: () => void;
  stop: () => void;
  interimText: string;
  error: string | null;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Mikrofon-Zugriff wurde verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.",
  "permission-denied": "Mikrofon-Zugriff wurde verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.",
  "no-speech": "Es wurde nichts gehört. Versuch es nochmal oder tippe deine Antwort.",
  "audio-capture": "Kein Mikrofon gefunden. Prüfe deine Geräteeinstellungen.",
  network: "Netzwerkfehler bei der Spracherkennung. Bitte versuch es erneut.",
  "service-not-allowed": "Spracherkennung ist in diesem Browser/Kontext blockiert.",
};

export function useVoiceRecorder(onResult: (finalText: string, seconds: number) => void): UseVoiceRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const startTimeRef = useRef<number>(0);
  const finalTextRef = useRef<string>("");

  const isSupported =
    typeof window !== "undefined" &&
    Boolean((window as WindowWithSpeech).SpeechRecognition || (window as WindowWithSpeech).webkitSpeechRecognition);

  const start = useCallback(() => {
    if (!isSupported) return;
    const SpeechRecognitionCtor =
      (window as WindowWithSpeech).SpeechRecognition || (window as WindowWithSpeech).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    setError(null);

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

    finalTextRef.current = "";
    startTimeRef.current = Date.now();

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
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      const code = event?.error;
      setIsRecording(false);
      if (code && code !== "aborted") {
        setError(ERROR_MESSAGES[code] ?? `Fehler bei der Spracherkennung (${code}).`);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsRecording(true);
    } catch {
      setError("Spracherkennung konnte nicht gestartet werden. Bitte versuch es erneut.");
      setIsRecording(false);
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    const seconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    const text = finalTextRef.current.trim();
    setInterimText("");
    if (text) onResult(text, seconds);
  }, [onResult]);

  return { isSupported, isRecording, start, stop, interimText, error };
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

"use client";

import { useCallback, useRef, useState } from "react";

interface UseVoiceRecorderResult {
  isSupported: boolean;
  isRecording: boolean;
  start: () => void;
  stop: () => void;
  interimText: string;
}

export function useVoiceRecorder(onResult: (finalText: string, seconds: number) => void): UseVoiceRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
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

    const recognition: SpeechRecognitionLike = new SpeechRecognitionCtor();
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

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isSupported]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    const seconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    const text = finalTextRef.current.trim();
    setInterimText("");
    if (text) onResult(text, seconds);
  }, [onResult]);

  return { isSupported, isRecording, start, stop, interimText };
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

interface WindowWithSpeech {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
}

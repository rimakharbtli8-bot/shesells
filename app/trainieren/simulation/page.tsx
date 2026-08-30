"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mic, Square, Send, Volume2, X, Pause as PauseIcon, Play, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store/useAppStore";
import { useVoiceRecorder } from "@/lib/hooks/useVoiceRecorder";
import { getObjectionBySlug } from "@/lib/data/objections";
import { getDifficultyTone, getStartingResistance } from "@/lib/ai/mockCustomer";
import { getLevelForXp } from "@/lib/data/levels";
import { SCORE_DIMENSIONS } from "@/lib/config";
import type { ChatMessage, Difficulty, ScoreBreakdown, SessionFeedback, TrainingTypeId } from "@/lib/types";

type Phase = "loading" | "chat" | "waiting" | "result";

function SimulationContent() {
  const searchParams = useSearchParams();
  const trainingType = (searchParams.get("type") as TrainingTypeId) || "frei";
  const difficulty = (searchParams.get("difficulty") as Difficulty) || "fortgeschritten";
  const objectionSlug = searchParams.get("objection") || undefined;
  const objection = objectionSlug ? getObjectionBySlug(objectionSlug) : undefined;

  const xp = useAppStore((s) => s.xp);
  const addSession = useAppStore((s) => s.addSession);

  const [phase, setPhase] = useState<Phase>("loading");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [resistance, setResistance] = useState(getStartingResistance(difficulty));
  const [turn, setTurn] = useState(0);
  const [paused, setPaused] = useState(false);
  const [levelUp, setLevelUp] = useState<{ level: number; name: string } | null>(null);

  const [resultScore, setResultScore] = useState(0);
  const [resultBreakdown, setResultBreakdown] = useState<ScoreBreakdown | null>(null);
  const [resultFeedback, setResultFeedback] = useState<SessionFeedback | null>(null);
  const [xpEarnedDisplay, setXpEarnedDisplay] = useState(0);

  const breakdownsRef = useRef<ScoreBreakdown[]>([]);
  const startTimeRef = useRef(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    startOpening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startOpening() {
    setPhase("loading");
    const res = await fetch("/api/customer-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "opening", trainingType, difficulty, objectionSlug }),
    });
    const data = await res.json();
    const opening: ChatMessage = {
      id: `m_${Date.now()}`,
      role: "customer",
      text: data.text,
      timestamp: Date.now(),
    };
    setMessages([opening]);
    transcriptRef.current = [opening];
    setPhase("chat");
  }

  async function sendReply(text: string, inputMode: "text" | "voice", spokenSeconds?: number) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `m_${Date.now()}_u`,
      role: "user",
      text: trimmed,
      timestamp: Date.now(),
      inputMode,
    };
    setMessages((m) => [...m, userMsg]);
    transcriptRef.current = [...transcriptRef.current, userMsg];
    setInputText("");
    setPhase("waiting");

    const analyzeRes = await fetch("/api/analyze-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: trimmed,
        difficulty,
        spokenSeconds,
        objectionText: objection?.text,
      }),
    });
    const analyzeData = await analyzeRes.json();
    breakdownsRef.current = [...breakdownsRef.current, analyzeData.breakdown];

    const customerRes = await fetch("/api/customer-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "reply",
        trainingType,
        difficulty,
        objectionSlug,
        userReply: trimmed,
        resistance,
        turn,
      }),
    });
    const customerData = await customerRes.json();

    const customerMsg: ChatMessage = {
      id: `m_${Date.now()}_c`,
      role: "customer",
      text: customerData.text,
      timestamp: Date.now(),
    };
    setMessages((m) => [...m, customerMsg]);
    transcriptRef.current = [...transcriptRef.current, customerMsg];
    setResistance(customerData.resistance);
    setTurn((t) => t + 1);

    if (customerData.isClosing) {
      finalizeSession(analyzeData.feedback);
    } else {
      setPhase("chat");
    }
  }

  function finalizeSession(lastFeedback: SessionFeedback) {
    const breakdowns = breakdownsRef.current;
    const avgBreakdown = SCORE_DIMENSIONS.reduce((acc, dim) => {
      const avg = Math.round(
        breakdowns.reduce((sum, b) => sum + b[dim.key], 0) / breakdowns.length,
      );
      return { ...acc, [dim.key]: avg };
    }, {} as ScoreBreakdown);
    const score = Math.round(
      Object.values(avgBreakdown).reduce((a, b) => a + b, 0) / Object.values(avgBreakdown).length,
    );

    const xpBefore = getLevelForXp(xp);

    const session = addSession({
      trainingType,
      difficulty,
      objectionId: objection?.id,
      objectionText: objection?.text,
      transcript: transcriptRef.current,
      score,
      breakdown: avgBreakdown,
      feedback: lastFeedback,
      durationSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
    });

    const xpAfter = getLevelForXp(xp + session.xpEarned);
    if (xpAfter.level > xpBefore.level) {
      setLevelUp({ level: xpAfter.level, name: xpAfter.name });
    }

    setResultScore(score);
    setResultBreakdown(avgBreakdown);
    setResultFeedback(lastFeedback);
    setXpEarnedDisplay(session.xpEarned);
    setPhase("result");
  }

  const recorder = useVoiceRecorder((finalText, seconds) => {
    sendReply(finalText, "voice", seconds);
  });

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    window.speechSynthesis.speak(utterance);
  }

  function restart() {
    const params = new URLSearchParams();
    params.set("type", trainingType);
    params.set("difficulty", difficulty);
    if (objectionSlug) params.set("objection", objectionSlug);
    window.location.href = `/trainieren/simulation?${params.toString()}`;
  }

  if (phase === "result" && resultBreakdown && resultFeedback) {
    return (
      <ResultScreen
        score={resultScore}
        breakdown={resultBreakdown}
        feedback={resultFeedback}
        xpEarned={xpEarnedDisplay}
        levelUp={levelUp}
        onRetry={restart}
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col lg:h-[calc(100vh-5rem)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            {objection ? "Einwandtraining" : "Freies Training"}
          </p>
          <h1 className="text-lg font-semibold text-ink">
            Du sprichst jetzt mit einem {getDifficultyTone(difficulty)} Kunden.
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaused((p) => !p)}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink-soft hover:bg-sand/60"
          >
            {paused ? <Play size={14} /> : <PauseIcon size={14} />}
            {paused ? "Fortsetzen" : "Pause"}
          </button>
          <Link
            href="/trainieren"
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink-soft hover:bg-sand/60"
          >
            <X size={14} />
            Beenden
          </Link>
        </div>
      </div>

      <div className="mb-3">
        <div className="mb-1 flex justify-between text-xs text-ink-muted">
          <span>Widerstand des Kunden</span>
          <span>{resistance}%</span>
        </div>
        <ProgressBar percent={resistance} barClassName={cn(resistance > 60 ? "bg-danger" : resistance > 35 ? "bg-warn" : "bg-accent")} />
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-line bg-surface p-4 scrollbar-none">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onSpeak={speak} />
        ))}
        {phase === "waiting" && (
          <div className="flex items-center gap-1.5 rounded-2xl bg-sand px-4 py-2.5 text-sm text-ink-muted w-fit">
            <span className="animate-pulse">Kunde antwortet …</span>
          </div>
        )}
        {phase === "loading" && (
          <div className="flex items-center gap-1.5 text-sm text-ink-muted">Gespräch wird vorbereitet …</div>
        )}
      </div>

      {paused ? (
        <Card className="mt-3 text-center text-sm text-ink-muted">Training pausiert. Klicke auf „Fortsetzen“, um weiterzumachen.</Card>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {recorder.isRecording && (
            <div className="flex items-center gap-2 text-sm font-medium text-danger">
              <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />
              Aufnahme läuft … {recorder.interimText && <span className="text-ink-muted">„{recorder.interimText}“</span>}
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Deine Antwort …"
              rows={2}
              disabled={phase !== "chat"}
              className="flex-1 resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-ink disabled:opacity-60"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendReply(inputText, "text");
                }
              }}
            />
            <div className="flex flex-col gap-2">
              {recorder.isSupported && (
                <button
                  onClick={() => (recorder.isRecording ? recorder.stop() : recorder.start())}
                  disabled={phase !== "chat"}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl transition-colors disabled:opacity-50",
                    recorder.isRecording ? "bg-danger text-white" : "bg-sand text-ink hover:bg-sand-dark",
                  )}
                  title="Antwort aufnehmen"
                >
                  {recorder.isRecording ? <Square size={18} /> : <Mic size={18} />}
                </button>
              )}
              <Button
                onClick={() => sendReply(inputText, "text")}
                disabled={phase !== "chat" || !inputText.trim()}
                className="h-11 px-4"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
          <p className="text-xs text-ink-muted">
            {recorder.isSupported
              ? "Antwort aufnehmen oder tippen — Enter zum Senden."
              : "Spracherkennung wird von diesem Browser nicht unterstützt. Bitte tippen."}
          </p>
          {recorder.error && <p className="text-xs text-danger">{recorder.error}</p>}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message, onSpeak }: { message: ChatMessage; onSpeak: (text: string) => void }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser ? "bg-ink text-white" : "bg-sand text-ink",
        )}
      >
        <p>{message.text}</p>
        <div className="mt-1 flex items-center gap-2">
          {message.inputMode === "voice" && (
            <span
              className={cn(
                "flex items-center gap-1 text-[10px] uppercase tracking-wide",
                isUser ? "text-white/60" : "text-ink-muted",
              )}
            >
              <Mic size={10} /> Sprachantwort
            </span>
          )}
          {!isUser && (
            <button
              onClick={() => onSpeak(message.text)}
              className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-ink-muted hover:text-ink"
            >
              <Volume2 size={11} /> Antwort anhören
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultScreen({
  score,
  breakdown,
  feedback,
  xpEarned,
  levelUp,
  onRetry,
}: {
  score: number;
  breakdown: ScoreBreakdown;
  feedback: SessionFeedback;
  xpEarned: number;
  levelUp: { level: number; name: string } | null;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col gap-6 pb-10">
      {levelUp && (
        <Card className="animate-level-pop flex flex-col items-center gap-2 !border-accent !bg-accent text-center !text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
            <TrendingUp size={22} />
          </div>
          <div className="mt-1 text-lg font-semibold">Level Up!</div>
          <div className="text-sm text-white/90">
            Du bist jetzt Level {levelUp.level} – {levelUp.name}
          </div>
        </Card>
      )}

      <Card className="flex flex-col items-center gap-2 text-center">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Gesamtscore</span>
        <span className="text-5xl font-semibold tracking-tight text-ink">{score}</span>
        <span className="text-sm text-ink-muted">von 100 Punkten</span>
        <span className="mt-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-dark">
          +{xpEarned} XP
        </span>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-ink">Bewertung im Detail</h2>
        <div className="flex flex-col gap-3">
          {SCORE_DIMENSIONS.map((dim) => (
            <div key={dim.key}>
              <div className="mb-1 flex justify-between text-xs text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <dim.icon size={13} />
                  {dim.label}
                </span>
                <span>{breakdown[dim.key]}</span>
              </div>
              <ProgressBar percent={breakdown[dim.key]} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-ink">Was du gut gemacht hast</h2>
        <ul className="list-disc space-y-1 pl-4 text-sm text-ink-soft">
          {feedback.good.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-ink">Was du verbessern kannst</h2>
        <ul className="list-disc space-y-1 pl-4 text-sm text-ink-soft">
          {feedback.improve.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ul>
      </Card>

      <Card className="!border-accent/30 !bg-accent-soft">
        <h2 className="mb-1 text-sm font-semibold text-accent-dark">Dein nächster Fokus</h2>
        <p className="text-sm text-ink-soft">{feedback.focus}</p>
        <p className="mt-2 text-sm font-medium text-ink">{feedback.recommendedExercise}</p>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onRetry}>Erneut versuchen</Button>
        <Link href="/trainieren">
          <Button variant="secondary">Nächsten Einwand</Button>
        </Link>
        <Link href="/">
          <Button variant="ghost">Beenden</Button>
        </Link>
      </div>
    </div>
  );
}

export default function SimulationPage() {
  return (
    <Suspense>
      <SimulationContent />
    </Suspense>
  );
}

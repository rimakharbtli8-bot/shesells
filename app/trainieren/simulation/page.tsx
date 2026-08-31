"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mic, MicOff, Phone, PhoneOff, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store/useAppStore";
import { useCallVoice } from "@/lib/hooks/useCallVoice";
import { useCallTts } from "@/lib/hooks/useCallTts";
import { getObjectionBySlug } from "@/lib/data/objections";
import { DIFFICULTIES } from "@/lib/data/trainingTypes";
import { getStartingResistance } from "@/lib/ai/mockCustomer";
import { getInitialEmotionalState } from "@/lib/ai/persona";
import { getLevelForXp } from "@/lib/data/levels";
import { SCORE_DIMENSIONS } from "@/lib/config";
import type {
  ChatMessage,
  CustomerEmotionalState,
  CustomerPersona,
  Difficulty,
  ScoreBreakdown,
  SessionFeedback,
  TrainingTypeId,
} from "@/lib/types";

type Phase = "incoming" | "connecting" | "ai-speaking" | "listening" | "thinking" | "result";

function SimulationContent() {
  const searchParams = useSearchParams();
  const trainingType = (searchParams.get("type") as TrainingTypeId) || "frei";
  const difficulty = (searchParams.get("difficulty") as Difficulty) || "fortgeschritten";
  const objectionSlug = searchParams.get("objection") || undefined;
  const objection = objectionSlug ? getObjectionBySlug(objectionSlug) : undefined;
  const difficultyLabel = DIFFICULTIES.find((d) => d.id === difficulty)?.label ?? difficulty;

  const xp = useAppStore((s) => s.xp);
  const addSession = useAppStore((s) => s.addSession);

  const [phase, setPhase] = useState<Phase>("incoming");
  const [caption, setCaption] = useState("");
  const [resistance, setResistance] = useState(getStartingResistance(difficulty));
  const [turn, setTurn] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [levelUp, setLevelUp] = useState<{ level: number; name: string } | null>(null);
  const [typedFallback, setTypedFallback] = useState("");
  const [callError, setCallError] = useState<string | null>(null);
  const [persona, setPersona] = useState<CustomerPersona | null>(null);

  const personaRef = useRef<CustomerPersona | null>(null);
  const emotionalStateRef = useRef<CustomerEmotionalState>(getInitialEmotionalState(difficulty));

  const [resultScore, setResultScore] = useState(0);
  const [resultBreakdown, setResultBreakdown] = useState<ScoreBreakdown | null>(null);
  const [resultFeedback, setResultFeedback] = useState<SessionFeedback | null>(null);
  const [xpEarnedDisplay, setXpEarnedDisplay] = useState(0);

  const breakdownsRef = useRef<ScoreBreakdown[]>([]);
  const callStartRef = useRef(0);
  const transcriptRef = useRef<ChatMessage[]>([]);
  const isMutedRef = useRef(false);
  isMutedRef.current = isMuted;

  const tts = useCallTts();
  const callVoice = useCallVoice({
    enabled: phase === "listening" && !isMuted,
    onUtterance: (text, seconds) => {
      if (isMutedRef.current) return;
      handleUtterance(text, seconds);
    },
  });

  useEffect(() => {
    if (phase === "incoming" || phase === "result") return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    return () => {
      tts.cancel();
      callVoice.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function answerCall() {
    callStartRef.current = Date.now();
    setPhase("connecting");
    setCallError(null);
    try {
      const res = await fetch("/api/customer-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "opening", trainingType, difficulty, objectionSlug }),
      });
      if (!res.ok) throw new Error(`customer-response returned ${res.status}`);
      const data = await res.json();
      if (!data?.text) throw new Error("customer-response missing text");
      const opening: ChatMessage = { id: `m_${Date.now()}`, role: "customer", text: data.text, timestamp: Date.now() };
      transcriptRef.current = [opening];
      if (data.persona) {
        personaRef.current = data.persona;
        setPersona(data.persona);
      }
      if (data.emotionalState) emotionalStateRef.current = data.emotionalState;
      if (typeof data.resistance === "number") setResistance(data.resistance);
      speakThenListen(data.text);
    } catch (err) {
      console.error("answerCall failed:", err);
      setCallError("Verbindung fehlgeschlagen. Bitte nochmal versuchen.");
      setPhase("incoming");
    }
  }

  function speakThenListen(text: string) {
    setCaption(text);
    setPhase("ai-speaking");
    tts.speak(
      text,
      () => {
        setPhase("listening");
        setCaption("");
        if (!isMutedRef.current) callVoice.start();
      },
      personaRef.current?.gender,
    );
  }

  async function handleUtterance(text: string, seconds: number) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `m_${Date.now()}_u`,
      role: "user",
      text: trimmed,
      timestamp: Date.now(),
      inputMode: "voice",
    };
    const priorTranscript = transcriptRef.current;
    transcriptRef.current = [...priorTranscript, userMsg];
    setPhase("thinking");
    setCaption("");
    setCallError(null);

    try {
      // These two calls don't depend on each other's result — run them
      // concurrently instead of back-to-back, which was needlessly
      // doubling the "customer is thinking" wait on every turn.
      const [analyzeRes, customerRes] = await Promise.all([
        fetch("/api/analyze-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: trimmed,
            difficulty,
            spokenSeconds: seconds,
            objectionText: objection?.text,
            transcript: priorTranscript,
          }),
        }),
        fetch("/api/customer-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "reply",
            trainingType,
            difficulty,
            objectionSlug,
            userReply: trimmed,
            turn,
            transcript: priorTranscript,
            persona: personaRef.current,
            emotionalState: emotionalStateRef.current,
          }),
        }),
      ]);

      if (!analyzeRes.ok) throw new Error(`analyze-response returned ${analyzeRes.status}`);
      const analyzeData = await analyzeRes.json();
      if (!analyzeData?.breakdown) throw new Error("analyze-response missing breakdown");
      breakdownsRef.current = [...breakdownsRef.current, analyzeData.breakdown];

      if (!customerRes.ok) throw new Error(`customer-response returned ${customerRes.status}`);
      const customerData = await customerRes.json();
      if (!customerData?.text) throw new Error("customer-response missing text");
      if (customerData.emotionalState) emotionalStateRef.current = customerData.emotionalState;

      const customerMsg: ChatMessage = {
        id: `m_${Date.now()}_c`,
        role: "customer",
        text: customerData.text,
        timestamp: Date.now(),
      };
      transcriptRef.current = [...transcriptRef.current, customerMsg];
      setResistance(customerData.resistance);
      setTurn((t) => t + 1);

      if (customerData.isClosing || customerData.hangsUp) {
        setCaption(customerData.text);
        setPhase("ai-speaking");
        tts.speak(customerData.text, () => finalizeSession(analyzeData.feedback), personaRef.current?.gender);
      } else {
        speakThenListen(customerData.text);
      }
    } catch (err) {
      console.error("handleUtterance failed:", err);
      setCallError("Da ist etwas schiefgelaufen. Sprich einfach nochmal.");
      setPhase("listening");
      if (!isMutedRef.current) callVoice.start();
    }
  }

  function finalizeSession(lastFeedback: SessionFeedback) {
    callVoice.stop();
    const breakdowns = breakdownsRef.current;

    if (breakdowns.length === 0) {
      window.location.href = "/trainieren";
      return;
    }

    const avgBreakdown = SCORE_DIMENSIONS.reduce((acc, dim) => {
      const avg = Math.round(breakdowns.reduce((sum, b) => sum + b[dim.key], 0) / breakdowns.length);
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
      durationSeconds: Math.round((Date.now() - callStartRef.current) / 1000),
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

  function hangUp() {
    tts.cancel();
    callVoice.stop();
    if (breakdownsRef.current.length === 0) {
      window.location.href = "/trainieren";
      return;
    }
    finalizeSession({
      good: ["Du hast das Gespräch aktiv geführt."],
      improve: ["Versuch beim nächsten Mal, das Gespräch bis zum natürlichen Ende zu führen — dann bekommst du vollständigeres Feedback."],
      focus: "Gesprächsdauer",
      recommendedExercise: "Führe das nächste Training bis zum Abschluss durch.",
      customerFeltReport: "Nicht auswertbar — das Gespräch wurde vorzeitig beendet.",
      goldenPath: "Führe das Training beim nächsten Mal bis zum natürlichen Ende, damit eine echte Analyse des Gesprächsverlaufs möglich ist.",
    });
  }

  function toggleMute() {
    setIsMuted((m) => {
      const next = !m;
      if (next) {
        callVoice.stop();
      } else if (phase === "listening") {
        callVoice.start();
      }
      return next;
    });
  }

  function submitTypedFallback() {
    const text = typedFallback.trim();
    if (!text) return;
    setTypedFallback("");
    handleUtterance(text, Math.max(2, Math.round(text.split(/\s+/).length / 2.5)));
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

  const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");

  const statusLabel: Record<Phase, string> = {
    incoming: "Eingehender Anruf",
    connecting: "Verbindung wird aufgebaut …",
    "ai-speaking": "Kunde spricht …",
    listening: isMuted ? "Stummgeschaltet" : "Du bist dran …",
    thinking: "Kunde überlegt …",
    result: "",
  };

  const needsTypedFallback = phase === "listening" && !callVoice.isSupported;

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col items-center justify-between py-6 lg:h-[calc(100vh-5rem)]">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          {objection ? "Einwandtraining" : "Freies Training"} · {difficultyLabel}
        </p>
        <h1 className="text-base font-semibold text-ink">{persona ? persona.name : "Kunde am Telefon"}</h1>
        <p className="text-xs text-ink-muted">{persona ? persona.archetype : "Verbindung wird gleich aufgebaut"}</p>
        {phase !== "incoming" && (
          <span className="mt-1 text-sm tabular-nums text-ink-muted">
            {minutes}:{seconds}
          </span>
        )}
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="relative flex h-40 w-40 items-center justify-center">
          {phase === "ai-speaking" && <span className="absolute inset-0 animate-ping rounded-full bg-accent/20" />}
          {phase === "listening" && !isMuted && <span className="absolute inset-0 animate-pulse rounded-full bg-ink/10" />}
          <div
            className={cn(
              "relative flex h-28 w-28 items-center justify-center rounded-full text-3xl font-semibold text-white transition-colors",
              phase === "ai-speaking" ? "bg-accent" : "bg-ink",
            )}
          >
            {persona ? persona.name.charAt(0) : "?"}
          </div>
        </div>
        <p className="text-sm font-medium text-ink-muted">{statusLabel[phase]}</p>
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-4 px-4">
        {phase !== "incoming" && (
          <div className="w-full">
            <div className="mb-1 flex justify-between text-xs text-ink-muted">
              <span>Widerstand des Kunden</span>
              <span>{resistance}%</span>
            </div>
            <ProgressBar
              percent={resistance}
              barClassName={cn(resistance > 60 ? "bg-danger" : resistance > 35 ? "bg-warn" : "bg-accent")}
            />
          </div>
        )}

        <div className="min-h-[3rem] w-full rounded-xl bg-sand/70 px-4 py-2.5 text-center text-sm text-ink-soft">
          {phase === "listening" && !isMuted ? callVoice.liveText || "…" : caption || " "}
        </div>

        {callVoice.error && <p className="text-xs text-danger">{callVoice.error}</p>}
        {callError && <p className="text-xs text-danger">{callError}</p>}

        {needsTypedFallback && (
          <div className="flex w-full gap-2">
            <input
              autoFocus
              value={typedFallback}
              onChange={(e) => setTypedFallback(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitTypedFallback()}
              placeholder="Spracherkennung nicht verfügbar — Antwort tippen …"
              className="flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-ink"
            />
            <Button onClick={submitTypedFallback} disabled={!typedFallback.trim()}>
              Senden
            </Button>
          </div>
        )}

        {phase === "incoming" ? (
          <button
            onClick={answerCall}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-soft transition-transform hover:brightness-105 active:scale-95"
            title="Anruf annehmen"
          >
            <Phone size={26} />
          </button>
        ) : (
          <div className="flex items-center gap-4">
            {callVoice.isSupported && (
              <button
                onClick={toggleMute}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                  isMuted ? "bg-danger text-white" : "bg-sand text-ink hover:bg-sand-dark",
                )}
                title={isMuted ? "Stummschaltung aufheben" : "Stummschalten"}
              >
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}
            <button
              onClick={hangUp}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-danger text-white shadow-soft transition-transform hover:brightness-105 active:scale-95"
              title="Auflegen"
            >
              <PhoneOff size={22} />
            </button>
          </div>
        )}
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

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-ink">Was der Kunde wirklich gefühlt hat</h2>
        <p className="text-sm leading-relaxed text-ink-soft">{feedback.customerFeltReport}</p>
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-ink">So hätte ein sehr guter Closer reagiert</h2>
        <p className="text-sm leading-relaxed text-ink-soft">{feedback.goldenPath}</p>
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

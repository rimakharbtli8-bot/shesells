"use client";

import { useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store/useAppStore";
import { answerCoachQuestion, getWeakestDimensionLabel } from "@/lib/ai/mockCoach";

interface CoachMessage {
  id: string;
  role: "coach" | "user";
  text: string;
}

const SUGGESTIONS = [
  "Wie hätte ich auf diesen Einwand besser reagieren können?",
  "Warum hat meine Antwort nicht funktioniert?",
  "Welche Frage hätte ich stellen sollen?",
  "Trainiere mit mir genau diesen Einwand.",
];

export default function CoachPage() {
  const sessions = useAppStore((s) => s.sessions);
  const weakest = getWeakestDimensionLabel(sessions);

  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: "intro",
      role: "coach",
      text: `Hi! Ich bin dein KI-Coach. Ich kenne deine letzten ${sessions.length} Trainings — dein aktueller Fokusbereich ist „${weakest}“. Wie kann ich dir helfen?`,
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  function ask(question: string) {
    if (!question.trim()) return;
    const userMsg: CoachMessage = { id: `u_${Date.now()}`, role: "user", text: question };
    const answer = answerCoachQuestion(question, sessions);
    const coachMsg: CoachMessage = { id: `c_${Date.now()}`, role: "coach", text: answer };
    setMessages((m) => [...m, userMsg, coachMsg]);
    setInput("");
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col lg:h-[calc(100vh-5rem)]">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white">
          <Sparkles size={16} />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-ink">Mein KI-Coach</h1>
          <p className="text-xs text-ink-muted">Kennt deinen Trainingsfortschritt.</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-line bg-surface p-4 scrollbar-none">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user" ? "bg-ink text-white" : "bg-sand text-ink",
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => ask(s)}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-ink/40"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Frag deinen Coach etwas …"
          className="flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-ink"
          onKeyDown={(e) => {
            if (e.key === "Enter") ask(input);
          }}
        />
        <button
          onClick={() => ask(input)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-white hover:bg-ink-soft"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

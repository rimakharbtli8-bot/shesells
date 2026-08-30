import { NextResponse } from "next/server";
import { FEATURES } from "@/lib/config";
import { analyzeReply, buildFeedback, overallScore, scoreReply } from "@/lib/ai/scoring";
import type { Difficulty } from "@/lib/types";

// LLM_API_KEY would also power richer, model-generated feedback text here.
const LLM_API_KEY = process.env.LLM_API_KEY;

export async function POST(request: Request) {
  const body = await request.json();
  const {
    text,
    difficulty,
    spokenSeconds,
    objectionText,
  }: { text: string; difficulty: Difficulty; spokenSeconds?: number; objectionText?: string } = body;

  if (FEATURES.useRealLLM && LLM_API_KEY) {
    // TODO: send the transcript to the real LLM for qualitative analysis
    // (content, clarity, empathy, tonality, filler words, etc.) and return
    // its breakdown + feedback instead of the heuristic mock below.
  }

  const breakdown = scoreReply(text, difficulty, spokenSeconds);
  const analysis = analyzeReply(text, spokenSeconds);
  const feedback = buildFeedback(breakdown, analysis, objectionText ?? "diesen Einwand");

  return NextResponse.json({ breakdown, analysis, feedback, score: overallScore(breakdown) });
}

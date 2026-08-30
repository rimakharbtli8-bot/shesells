import { NextResponse } from "next/server";
import { FEATURES } from "@/lib/config";
import { generateCustomerTurn, getOpeningLine } from "@/lib/ai/mockCustomer";
import { getObjectionBySlug } from "@/lib/data/objections";
import type { Difficulty, TrainingTypeId } from "@/lib/types";

// LLM_API_KEY is intentionally only read on the server. Once a provider is
// wired up, branch on FEATURES.useRealLLM and call it here — the response
// contract (CustomerTurnResult) stays the same either way.
const LLM_API_KEY = process.env.LLM_API_KEY;

export async function POST(request: Request) {
  const body = await request.json();
  const {
    mode,
    trainingType,
    difficulty,
    objectionSlug,
    userReply,
    resistance,
    turn,
  }: {
    mode: "opening" | "reply";
    trainingType: TrainingTypeId;
    difficulty: Difficulty;
    objectionSlug?: string;
    userReply?: string;
    resistance?: number;
    turn?: number;
  } = body;

  const objection = objectionSlug ? getObjectionBySlug(objectionSlug) : undefined;

  if (FEATURES.useRealLLM && LLM_API_KEY) {
    // TODO: call the real LLM provider here using LLM_API_KEY and return an
    // equivalent payload. Falling through to the mock engine until then.
  }

  if (mode === "opening") {
    const text = getOpeningLine(trainingType, difficulty, objection);
    return NextResponse.json({ text, resistance: null, isClosing: false, quality: null });
  }

  const result = generateCustomerTurn({
    userReply: userReply ?? "",
    difficulty,
    resistance: resistance ?? 50,
    turn: turn ?? 1,
    objection,
  });

  return NextResponse.json(result);
}

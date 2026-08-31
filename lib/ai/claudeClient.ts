import Anthropic from "@anthropic-ai/sdk";

// Imported only from app/api/*/route.ts handlers — never from client components.

// The customer's voice runs on every single call turn, so it's on the
// fastest model — a slow "thinking" pause there is felt immediately.
// Scoring/feedback (analyze-response) runs in the background and never
// blocks the conversation, so it can afford the stronger, slower model.
export const CUSTOMER_MODEL = "claude-haiku-4-5-20251001";
export const SCORE_MODEL = "claude-sonnet-5";

let cachedClient: Anthropic | null = null;

/** Server-only. Returns null when LLM_API_KEY isn't configured, in which
 *  case callers fall back to the heuristic mock engine. */
export function getClaudeClient(): Anthropic | null {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) return null;
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey });
  }
  return cachedClient;
}

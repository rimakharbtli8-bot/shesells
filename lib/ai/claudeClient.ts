import Anthropic from "@anthropic-ai/sdk";

// Imported only from app/api/*/route.ts handlers — never from client components.

// Sonnet, not Opus: this model plays the customer live on every call turn,
// so response latency matters as much as reasoning depth here.
export const CLAUDE_MODEL = "claude-sonnet-5";

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

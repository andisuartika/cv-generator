import { z } from "zod";
import type { AiConfig } from "@/lib/ai/config";
import type { ReviewPayload } from "@/lib/ai/payload";
import { buildMessages, parseReview, type Review } from "@/lib/ai/review";

/** Server only: calls an OpenAI-compatible gateway such as 9router. */
const TIMEOUT_MS = 90_000;
const MAX_OUTPUT_TOKENS = 8000;

const CompletionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string().nullish() }) })).min(1),
});

/** Carries no response text, so it is safe to log. */
export class AiError extends Error {
  constructor(
    readonly reason: "unreachable" | "upstream" | "invalid",
    readonly status?: number,
  ) {
    super(`AI request failed: ${reason}${status ? ` ${status}` : ""}`);
    this.name = "AiError";
  }
}

async function complete(config: AiConfig, payload: ReviewPayload): Promise<string> {
  let response: Response;
  let body: unknown;
  try {
    response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.model,
        messages: buildMessages(payload),
        max_tokens: MAX_OUTPUT_TOKENS,
        stream: false,
      }),
      redirect: "error", // the key must not follow a redirect to another host
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) throw new AiError("upstream", response.status);
    body = await response.json().catch(() => null);
  } catch (error) {
    if (error instanceof AiError) throw error;
    throw new AiError("unreachable");
  }
  const parsed = CompletionSchema.safeParse(body);
  return parsed.success ? (parsed.data.choices[0].message.content ?? "") : "";
}

/** An answer in the wrong format is requested once more before giving up. */
export async function requestReview(config: AiConfig, payload: ReviewPayload): Promise<Review> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const review = parseReview(await complete(config, payload));
    if (review) return review;
  }
  throw new AiError("invalid");
}

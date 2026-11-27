import { z } from "zod";
import { AiError, requestReview } from "@/lib/ai/client";
import type { AiConfig } from "@/lib/ai/config";
import {
  hasReviewableContent,
  mapStrings,
  MAX_REVIEW_REQUEST_BYTES,
  redactContacts,
  ReviewPayloadSchema,
} from "@/lib/ai/payload";
import { checkJsonRequest, clientKey, failure, readBody } from "@/lib/server/http";
import { createRateLimiter, createSlots } from "@/lib/server/limits";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Consent travels with every request; nothing is remembered between them. */
const RequestSchema = z.object({ consent: z.literal(true), cv: ReviewPayloadSchema });

type HandlerOptions = {
  getConfig: () => AiConfig | null;
  review?: typeof requestReview;
};

export function createReviewHandler({ getConfig, review = requestReview }: HandlerOptions) {
  // Created on first use, because the limits come from the configuration.
  let limits: Record<"perClient" | "total", ReturnType<typeof createRateLimiter>> | undefined;
  const slots = createSlots(2);

  return async function handle(request: Request): Promise<Response> {
    const config = getConfig();
    if (!config) return failure(404, "Penilaian AI tidak aktif.");
    const rejected = checkJsonRequest(request);
    if (rejected) return rejected;

    const body = await readBody(request, MAX_REVIEW_REQUEST_BYTES);
    if (body === null) return failure(413, "CV terlalu panjang untuk dinilai.");
    let data: unknown;
    try {
      data = JSON.parse(body);
    } catch {
      return failure(400, "Data tidak valid.");
    }
    const parsed = RequestSchema.safeParse(data);
    if (!parsed.success) {
      return failure(400, "Data tidak valid, terlalu panjang, atau belum ada persetujuan.");
    }
    // The schema has already dropped unknown fields; contacts are removed again.
    const cv = mapStrings(parsed.data.cv, redactContacts);
    if (!hasReviewableContent(cv)) {
      return failure(400, "Isi ringkasan, pengalaman, atau proyek terlebih dahulu.");
    }

    // Counted only for requests that would reach the model, since those cost money.
    const release = slots();
    if (!release) {
      return failure(503, "Penilaian AI sedang sibuk. Coba lagi sebentar lagi.", { "Retry-After": "10" });
    }
    try {
      limits ??= {
        perClient: createRateLimiter(config.dailyLimitPerClient, DAY_MS),
        total: createRateLimiter(config.dailyLimitTotal, DAY_MS),
      };
      const wait = limits.perClient(clientKey(request.headers)) || limits.total("all");
      if (wait > 0) {
        return failure(429, "Batas harian penilaian AI sudah tercapai. Coba lagi besok.", {
          "Retry-After": String(wait),
        });
      }
      return Response.json(await review(config, cv), { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      // Never log messages or responses: they can contain CV content.
      const reason = error instanceof AiError ? `${error.reason} ${error.status ?? ""}` : "unknown";
      console.error("AI review failed:", reason.trim());
      return failure(
        502,
        error instanceof AiError && error.reason === "invalid"
          ? "Jawaban AI tidak bisa dibaca. Coba lagi nanti."
          : "Layanan AI sedang tidak bisa dihubungi.",
      );
    } finally {
      release();
    }
  };
}

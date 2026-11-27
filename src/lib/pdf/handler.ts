import { getExportFileName } from "@/lib/export/filename";
import { MAX_PDF_REQUEST_BYTES } from "@/lib/pdf/contract";
import { createRateLimiter, createSlots } from "@/lib/pdf/limits";
import { sanitizeResume } from "@/lib/resume-file";
import { ResumeSchema, type Resume } from "@/lib/schema";

type HandlerOptions = {
  render: (resume: Resume) => Promise<Uint8Array>;
  perClient?: ReturnType<typeof createRateLimiter>;
  overall?: ReturnType<typeof createRateLimiter>;
  slots?: ReturnType<typeof createSlots>;
};

function failure(status: number, message: string, headers: Record<string, string> = {}) {
  return Response.json(
    { message },
    { status, headers: { "Cache-Control": "no-store", ...headers } },
  );
}

/** Reads the body, giving up as soon as it grows past the limit. */
async function readBody(request: Request, maxBytes: number): Promise<string | null> {
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return text + decoder.decode();
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
}

/**
 * The address added by the reverse proxy. Earlier entries come from the client
 * and can be forged, so only the last one is used.
 */
function clientKey(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "direct";
}

function contentDisposition(name: string): string {
  const ascii = name.replace(/[^A-Za-z0-9]+/g, "-");
  return `attachment; filename="${ascii}.pdf"; filename*=UTF-8''${encodeURIComponent(name)}.pdf`;
}

/** The CV is processed in memory and never stored or logged. */
export function createPdfHandler({
  render,
  perClient = createRateLimiter(10, 60_000),
  overall = createRateLimiter(60, 60_000),
  slots = createSlots(2),
}: HandlerOptions) {
  return async function handle(request: Request): Promise<Response> {
    if (request.headers.get("sec-fetch-site") === "cross-site") {
      return failure(403, "Permintaan dari situs lain ditolak.");
    }
    if (!request.headers.get("content-type")?.startsWith("application/json")) {
      return failure(415, "Format permintaan harus JSON.");
    }
    const wait = perClient(clientKey(request.headers)) || overall("all");
    if (wait > 0) {
      return failure(429, "Terlalu banyak permintaan. Coba lagi sebentar lagi.", {
        "Retry-After": String(wait),
      });
    }

    const body = await readBody(request, MAX_PDF_REQUEST_BYTES);
    if (body === null) return failure(413, "Data CV terlalu besar (maksimal 5 MB).");

    let data: unknown;
    try {
      data = JSON.parse(body);
    } catch {
      return failure(400, "Data CV tidak valid.");
    }
    const parsed = ResumeSchema.safeParse(data);
    if (!parsed.success) return failure(400, "Data CV tidak valid.");
    const resume = sanitizeResume(parsed.data);

    const release = slots();
    if (!release) {
      return failure(503, "Server sedang sibuk. Coba lagi sebentar lagi.", { "Retry-After": "5" });
    }
    try {
      const pdf = await render(resume);
      return new Response(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": contentDisposition(getExportFileName(resume.basics.name)),
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error) {
      // Only the error type: messages could contain CV content.
      console.error("PDF export failed:", error instanceof Error ? error.name : "unknown");
      return failure(500, "PDF gagal dibuat di server.");
    } finally {
      release();
    }
  };
}

import { getExportFileName } from "@/lib/export/filename";
import { MAX_PDF_REQUEST_BYTES } from "@/lib/pdf/contract";
import { sanitizeResume } from "@/lib/resume-file";
import { ResumeSchema, type Resume } from "@/lib/schema";
import { checkJsonRequest, clientKey, failure, readBody } from "@/lib/server/http";
import { createRateLimiter, createSlots } from "@/lib/server/limits";

type HandlerOptions = {
  render: (resume: Resume) => Promise<Uint8Array>;
  perClient?: ReturnType<typeof createRateLimiter>;
  overall?: ReturnType<typeof createRateLimiter>;
  slots?: ReturnType<typeof createSlots>;
};

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
    const rejected = checkJsonRequest(request);
    if (rejected) return rejected;
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

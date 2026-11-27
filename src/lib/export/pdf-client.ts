import { downloadUrl } from "@/lib/export/download";
import type { Resume } from "@/lib/schema";

const FALLBACK_MESSAGE = "PDF gagal dibuat di server.";

/** Asks the server for a PDF. Throws an Error with a message for the user. */
export async function downloadServerPdf(resume: Resume, fileName: string) {
  let response: Response;
  try {
    response = await fetch("/api/export/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resume),
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new Error("Server tidak bisa dihubungi.");
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === "object" && body && "message" in body ? String(body.message) : null;
    throw new Error(message ?? FALLBACK_MESSAGE);
  }
  const url = URL.createObjectURL(await response.blob());
  downloadUrl(url, `${fileName}.pdf`);
  // Revoked later because some browsers start the download asynchronously.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Helpers shared by the route handlers that accept CV data. */
export function failure(status: number, message: string, headers: Record<string, string> = {}) {
  return Response.json(
    { message },
    { status, headers: { "Cache-Control": "no-store", ...headers } },
  );
}

/** Rejects requests sent by other sites and anything that is not JSON. */
export function checkJsonRequest(request: Request): Response | null {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return failure(403, "Permintaan dari situs lain ditolak.");
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return failure(415, "Format permintaan harus JSON.");
  }
  return null;
}

/** Reads the body, giving up as soon as it grows past the limit. */
export async function readBody(request: Request, maxBytes: number): Promise<string | null> {
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
export function clientKey(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "direct";
}

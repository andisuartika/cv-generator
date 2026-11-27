import { connection } from "next/server";
import { getAiConfig } from "@/lib/ai/config";
import { createReviewHandler } from "@/lib/ai/handler";

/** Tells the editor whether to offer the feature. Never exposes the key or address. */
export async function GET() {
  await connection(); // read the configuration at run time, not at build time
  const config = getAiConfig();
  return Response.json(
    config ? { enabled: true, provider: config.providerName } : { enabled: false },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export const POST = createReviewHandler({ getConfig: () => getAiConfig() });

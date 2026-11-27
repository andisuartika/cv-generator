import { chromium, type Browser } from "playwright";
import { PDF_DATA_GLOBAL, PDF_READY_ATTRIBUTE } from "@/lib/pdf/contract";
import type { Resume } from "@/lib/schema";

/** Server only: prints the /render page with headless Chromium. */
const TIMEOUT_MS = 20_000;

let launching: Promise<Browser> | undefined;

/** One browser is reused; it is launched again if it crashed or failed to start. */
async function getBrowser(): Promise<Browser> {
  const current = await launching?.catch(() => undefined);
  if (current?.isConnected()) return current;
  launching = chromium.launch();
  return launching;
}

/**
 * The address this server can reach itself on. It comes from configuration,
 * never from request headers, which a client controls.
 */
function renderOrigin(): string {
  const configured = process.env.PDF_RENDER_ORIGIN;
  return new URL(configured || `http://localhost:${process.env.PORT || 3000}`).origin;
}

export async function renderResumePdf(resume: Resume): Promise<Uint8Array> {
  const origin = renderOrigin();
  const browser = await getBrowser();
  // A fresh context per request keeps one CV from reaching another.
  const context = await browser.newContext({ serviceWorkers: "block" });
  try {
    context.setDefaultTimeout(TIMEOUT_MS);
    // The page may load this app only, so CV content cannot reach another host.
    await context.route("**/*", (route) =>
      new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
    );
    await context.addInitScript(
      ([key, value]) => {
        (window as unknown as Record<string, string>)[key] = value;
      },
      [PDF_DATA_GLOBAL, JSON.stringify(resume)],
    );
    const page = await context.newPage();
    await page.goto(`${origin}/render`);
    await page.locator(`body[${PDF_READY_ATTRIBUTE}]`).waitFor({ state: "attached" });
    return await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
  } finally {
    await context.close();
  }
}

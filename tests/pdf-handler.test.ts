import { afterEach, describe, expect, it, vi } from "vitest";
import { sampleResume } from "@/lib/defaults";
import { MAX_PDF_REQUEST_BYTES } from "@/lib/pdf/contract";
import { createPdfHandler } from "@/lib/pdf/handler";
import { createRateLimiter, createSlots } from "@/lib/server/limits";
import type { Resume } from "@/lib/schema";

const pdf = new TextEncoder().encode("%PDF-fake");

function post(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/export/pdf", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

function setup(options: Partial<Parameters<typeof createPdfHandler>[0]> = {}) {
  const render = vi.fn(async (_resume: Resume) => pdf);
  return { render, handle: createPdfHandler({ render, ...options }) };
}

afterEach(() => vi.restoreAllMocks());

describe("route PDF", () => {
  it("mengembalikan PDF dengan nama aman tanpa disimpan cache", async () => {
    const { handle } = setup();
    const data = { ...sampleResume, basics: { name: 'José "../x' } };
    const response = await handle(post(JSON.stringify(data)));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="CV-Jos-x-\d{4}-\d\d-\d\d\.pdf"; filename\*=UTF-8''CV-Jos%C3%A9-x-/,
    );
  });

  it("membersihkan data sebelum dirender", async () => {
    const { handle, render } = setup();
    await handle(post(JSON.stringify({ ...sampleResume, basics: { name: "A", photo: "http://169.254.169.254/x" } })));
    expect(render.mock.calls[0][0].basics.photo).toBeUndefined();
  });

  it("menolak permintaan yang salah tanpa merender", async () => {
    const { handle, render } = setup();
    expect((await handle(post("{}", { "content-type": "text/plain" }))).status).toBe(415);
    expect((await handle(post("{rusak"))).status).toBe(400);
    expect((await handle(post('{"a":1}'))).status).toBe(400);
    expect((await handle(post("{}", { "sec-fetch-site": "cross-site" }))).status).toBe(403);
    expect(render).not.toHaveBeenCalled();
  });

  it("menolak data lebih dari 5 MB, juga tanpa content-length yang jujur", async () => {
    const { handle, render } = setup();
    const big = "x".repeat(MAX_PDF_REQUEST_BYTES + 1);
    expect((await handle(post(big))).status).toBe(413);
    expect((await handle(post(big, { "content-length": "10" }))).status).toBe(413);
    expect(render).not.toHaveBeenCalled();
  });

  it("membatasi jumlah permintaan per alamat dari proxy", async () => {
    const { handle } = setup({ perClient: createRateLimiter(2, 60_000) });
    const send = (ip: string) => handle(post(JSON.stringify(sampleResume), { "x-forwarded-for": ip }));
    // The first entry is forged by the client and must not matter.
    expect((await send("1.1.1.1, 9.9.9.9")).status).toBe(200);
    expect((await send("2.2.2.2, 9.9.9.9")).status).toBe(200);
    const blocked = await send("3.3.3.3, 9.9.9.9");
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
    expect((await send("8.8.8.8")).status).toBe(200);
  });

  it("menolak saat server penuh dan melepas slot setelah selesai", async () => {
    let finish: () => void = () => {};
    const render = () => new Promise<Uint8Array>((resolve) => (finish = () => resolve(pdf)));
    const handle = createPdfHandler({ render, slots: createSlots(1) });
    const first = handle(post(JSON.stringify(sampleResume)));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect((await handle(post(JSON.stringify(sampleResume)))).status).toBe(503);
    finish();
    expect((await first).status).toBe(200);
    const third = handle(post(JSON.stringify(sampleResume)));
    await new Promise((resolve) => setTimeout(resolve, 10));
    finish();
    expect((await third).status).toBe(200);
  });

  it("tidak mencatat isi CV saat render gagal", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { handle } = setup({
      render: async () => {
        throw new Error(`gagal untuk ${sampleResume.basics.name} ${sampleResume.basics.email}`);
      },
    });
    const response = await handle(post(JSON.stringify(sampleResume)));
    expect(response.status).toBe(500);
    const output = JSON.stringify(log.mock.calls) + (await response.text());
    expect(output).not.toContain(sampleResume.basics.name);
    expect(output).not.toContain(sampleResume.basics.email);
  });
});

describe("pembatas", () => {
  it("membuka lagi setelah jendela waktu lewat", () => {
    let now = 0;
    const take = createRateLimiter(1, 1000, () => now);
    expect(take("a")).toBe(0);
    expect(take("a")).toBe(1);
    now = 1001;
    expect(take("a")).toBe(0);
  });
});

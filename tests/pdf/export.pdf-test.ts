import { spawn, type ChildProcess } from "node:child_process";
import { createServer, type AddressInfo } from "node:net";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sampleResume } from "@/lib/defaults";
import type { Resume } from "@/lib/schema";
import { templates } from "@/templates/registry";

const EXPERIENCES = 10;
const BULLETS = 5;

const longResume: Resume = {
  ...sampleResume,
  experience: Array.from({ length: EXPERIENCES }, (_, i) => ({
    ...sampleResume.experience[0],
    id: `long-${i}`,
    role: `Posisi ${i}`,
    bullets: Array.from(
      { length: BULLETS },
      (_, j) => `Butir ${i}.${j} mengerjakan fitur yang cukup panjang sehingga teksnya berpindah baris.`,
    ),
  })),
};

let server: ChildProcess;
let base: string;
let client = 0;

function freePort(): Promise<number> {
  return new Promise((resolve) => {
    const probe = createServer().listen(0, () => {
      const { port } = probe.address() as AddressInfo;
      probe.close(() => resolve(port));
    });
  });
}

beforeAll(async () => {
  const port = await freePort();
  base = `http://localhost:${port}`;
  server = spawn("node_modules/.bin/next", ["start", "-p", String(port)], {
    stdio: "ignore",
    env: { ...process.env, NODE_ENV: "production", PDF_RENDER_ORIGIN: "" },
  });
  for (let i = 0; i < 100; i++) {
    if (await fetch(base).then((r) => r.ok, () => false)) return;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error("Server tidak menyala. Jalankan `npm run build` dulu.");
});

afterAll(() => {
  server?.kill();
});

/** Requests a PDF and returns its size and the text of each page without spaces. */
async function exportPdf(resume: Resume) {
  const response = await fetch(`${base}/api/export/pdf`, {
    method: "POST",
    // A new address per request keeps the per-client rate limit out of the way.
    headers: { "Content-Type": "application/json", "x-forwarded-for": `10.0.0.${++client}` },
    body: JSON.stringify(resume),
  });
  expect(response.status).toBe(200);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const size = bytes.byteLength;
  const task = getDocument({ data: bytes });
  const document = await task.promise;
  const pages: string[] = [];
  for (let number = 1; number <= document.numPages; number++) {
    const content = await (await document.getPage(number)).getTextContent();
    const text = content.items.map((item) => ("str" in item ? item.str : "")).join("");
    pages.push(text.replace(/\s+/g, "").toLowerCase());
  }
  await task.destroy();
  return { size, pages };
}

describe.each(templates)("PDF template $name", ({ id }) => {
  it("data contoh: satu halaman, teks bisa diambil, di bawah 1 MB", async () => {
    const { size, pages } = await exportPdf({ ...sampleResume, templateId: id });
    expect(pages).toHaveLength(1);
    expect(size).toBeLessThan(1024 * 1024);
    for (const text of ["PutuContohNama", "PTContohTeknologi", "UniversitasContoh", "Flutter"]) {
      expect(pages[0]).toContain(text.toLowerCase());
    }
  });

  it("data panjang: tidak ada pengalaman yang terpotong dan urutannya benar", async () => {
    const { size, pages } = await exportPdf({ ...longResume, templateId: id });
    expect(pages.length).toBeGreaterThan(1);
    expect(size).toBeLessThan(1024 * 1024);

    const all = pages.join("");
    let previous = -1;
    for (let i = 0; i < EXPERIENCES; i++) {
      const markers = [`posisi${i}`, ...Array.from({ length: BULLETS }, (_, j) => `butir${i}.${j}`)];
      const holding = markers.map((m) => pages.findIndex((page) => page.includes(m)));
      expect(holding, `pengalaman ${i} ada di halaman ${holding.join()}`).toEqual(
        markers.map(() => holding[0]),
      );
      expect(holding[0]).toBeGreaterThanOrEqual(0);
      // Extracted text must follow reading order, which ATS parsers rely on.
      for (const marker of markers) {
        const position = all.indexOf(marker);
        expect(position, `urutan ${marker}`).toBeGreaterThan(previous);
        previous = position;
      }
    }
  });
});

describe("route PDF di server asli", () => {
  it("menolak data tidak valid dan metode GET", async () => {
    const response = await fetch(`${base}/api/export/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    expect(response.status).toBe(400);
    expect((await fetch(`${base}/api/export/pdf`)).status).toBe(405);
  });
});

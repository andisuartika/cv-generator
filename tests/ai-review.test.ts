import { afterEach, describe, expect, it, vi } from "vitest";
import { AiError, requestReview } from "@/lib/ai/client";
import { getAiConfig, type AiConfig } from "@/lib/ai/config";
import { createReviewHandler } from "@/lib/ai/handler";
import { buildReviewPayload, MAX_REVIEW_REQUEST_BYTES } from "@/lib/ai/payload";
import { parseReview, type Review } from "@/lib/ai/review";
import { sampleResume } from "@/lib/defaults";

const env = {
  AI_BASE_URL: "http://gateway.test/v1/",
  AI_API_KEY: "kunci-rahasia",
  AI_MODEL: "model-uji",
  AI_PROVIDER_NAME: "Penyedia Uji",
};
const config = getAiConfig(env) as AiConfig;
const cv = buildReviewPayload(sampleResume);
const answer: Review = {
  suggestions: [{ section: "experience", title: "Tambah hasil", problem: "Kurang hasil.", suggestion: "Tulis [jumlah]." }],
};
const completion = (content: string) => Response.json({ choices: [{ message: { content } }] });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("konfigurasi AI", () => {
  it("mati bila salah satu nilai wajib kosong", () => {
    expect(config).toMatchObject({ baseUrl: "http://gateway.test/v1", dailyLimitPerClient: 5, dailyLimitTotal: 100 });
    for (const key of Object.keys(env)) {
      expect(getAiConfig({ ...env, [key]: " " }), key).toBeNull();
    }
  });
});

describe("jawaban AI", () => {
  it("menerima JSON yang dibungkus teks dan menolak bentuk yang salah", () => {
    expect(parseReview("```json\n" + JSON.stringify(answer) + "\n```")).toEqual(answer);
    for (const bad of ["", "tidak bisa", "{rusak}", '{"suggestions":[]}', JSON.stringify({ suggestions: [{ ...answer.suggestions[0], section: "ngawur" }] })]) {
      expect(parseReview(bad), bad).toBeNull();
    }
    expect(parseReview(JSON.stringify({ suggestions: Array(6).fill(answer.suggestions[0]) }))).toBeNull();
  });

  it("memanggil gateway dengan model dan kunci dari server", async () => {
    const fetch = vi.fn(async () => completion(JSON.stringify(answer)));
    vi.stubGlobal("fetch", fetch);
    expect(await requestReview(config, cv)).toEqual(answer);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://gateway.test/v1/chat/completions");
    expect(init).toMatchObject({ redirect: "error", headers: { Authorization: "Bearer kunci-rahasia" } });
    expect(JSON.parse(String(init.body))).toMatchObject({ model: "model-uji", stream: false });
  });

  it("mencoba ulang sekali bila formatnya salah, lalu menyerah", async () => {
    const once = vi.fn().mockResolvedValueOnce(completion("maaf")).mockResolvedValueOnce(completion(JSON.stringify(answer)));
    vi.stubGlobal("fetch", once);
    expect(await requestReview(config, cv)).toEqual(answer);
    expect(once).toHaveBeenCalledTimes(2);
    const never = vi.fn(async () => completion("maaf"));
    vi.stubGlobal("fetch", never);
    await expect(requestReview(config, cv)).rejects.toMatchObject({ reason: "invalid" });
    expect(never).toHaveBeenCalledTimes(2);
  });

  it("tidak mengulang saat gateway menolak atau tidak terjangkau", async () => {
    const denied = vi.fn(async () => new Response("detail rahasia", { status: 401 }));
    vi.stubGlobal("fetch", denied);
    await expect(requestReview(config, cv)).rejects.toMatchObject({ reason: "upstream", status: 401 });
    expect(denied).toHaveBeenCalledTimes(1);
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("ECONNREFUSED"))));
    await expect(requestReview(config, cv)).rejects.toMatchObject({ reason: "unreachable" });
  });
});

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/ai/review", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

function setup(overrides: Partial<AiConfig> = {}) {
  const review = vi.fn(async (..._args: Parameters<typeof requestReview>) => answer);
  const handle = createReviewHandler({ getConfig: () => ({ ...config, ...overrides }), review });
  return { handle, review };
}

describe("route penilaian AI", () => {
  it("tidak memanggil model saat fitur mati", async () => {
    const review = vi.fn();
    const handle = createReviewHandler({ getConfig: () => null, review });
    expect((await handle(post({ consent: true, cv }))).status).toBe(404);
    expect(review).not.toHaveBeenCalled();
  });

  it("wajib persetujuan dan menolak permintaan yang salah", async () => {
    const { handle, review } = setup();
    expect((await handle(post({ cv }))).status).toBe(400);
    expect((await handle(post({ consent: false, cv }))).status).toBe(400);
    expect((await handle(post("{rusak"))).status).toBe(400);
    expect((await handle(post({ consent: true, cv: {} }))).status).toBe(400);
    expect((await handle(post({ consent: true, cv }, { "sec-fetch-site": "cross-site" }))).status).toBe(403);
    expect((await handle(post("x".repeat(MAX_REVIEW_REQUEST_BYTES + 1)))).status).toBe(413);
    expect(review).not.toHaveBeenCalled();
  });

  it("membuang kolom tak dikenal dan kontak, walau dikirim langsung", async () => {
    const { handle, review } = setup();
    const dirty = { ...cv, email: "a@b.com", basics: { phone: "081234567890" }, summary: "Email a@b.com, WA 081234567890" };
    expect((await handle(post({ consent: true, cv: dirty }))).status).toBe(200);
    const sent = JSON.stringify(review.mock.calls[0][1]);
    expect(sent).not.toContain("a@b.com");
    expect(sent).not.toContain("081234567890");
  });

  it("membatasi per pengunjung dan untuk seluruh server", async () => {
    const { handle, review } = setup({ dailyLimitPerClient: 2, dailyLimitTotal: 3 });
    const send = (ip: string) => handle(post({ consent: true, cv }, { "x-forwarded-for": ip }));
    expect((await send("1.1.1.1")).status).toBe(200);
    expect((await send("1.1.1.1")).status).toBe(200);
    expect((await send("1.1.1.1")).status).toBe(429);
    expect((await send("2.2.2.2")).status).toBe(200);
    expect((await send("3.3.3.3")).status).toBe(429);
    expect(review).toHaveBeenCalledTimes(3);
  });

  it("tidak membocorkan isi CV, jawaban, atau kunci saat gagal", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const error of [new AiError("upstream", 500), new Error(`gagal kunci-rahasia ${cv.summary}`)]) {
      const handle = createReviewHandler({ getConfig: () => config, review: async () => Promise.reject(error) });
      const response = await handle(post({ consent: true, cv }));
      expect(response.status).toBe(502);
      const output = JSON.stringify(log.mock.calls) + (await response.text());
      expect(output).not.toContain("kunci-rahasia");
      expect(output).not.toContain(String(cv.summary));
    }
  });
});

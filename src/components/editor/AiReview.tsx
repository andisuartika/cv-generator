"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { buildReviewPayload, hasReviewableContent } from "@/lib/ai/payload";
import { ReviewSchema, type Review } from "@/lib/ai/review";
import type { CheckTarget } from "@/lib/cv-check";
import { SECTION_LABELS } from "@/lib/sections";
import { resumeStore } from "@/store/resume-store";

const StatusSchema = z.object({ enabled: z.literal(true), provider: z.string() });

type Result = { review: Review; sent: string };

async function postReview(body: string): Promise<Review> {
  let response: Response;
  try {
    response = await fetch("/api/ai/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      // Two attempts on the server, plus some slack.
      signal: AbortSignal.timeout(190_000),
    });
  } catch {
    throw new Error("Server tidak bisa dihubungi.");
  }
  const data: unknown = await response.json().catch(() => null);
  const review = response.ok ? ReviewSchema.safeParse(data) : null;
  if (review?.success) return review.data;
  const message = z.object({ message: z.string() }).safeParse(data);
  throw new Error(message.success ? message.data.message : "Penilaian AI gagal.");
}

/** Optional AI review. It is hidden unless the server has it configured. */
export function AiReview({ onFix }: { onFix: (target: CheckTarget) => void }) {
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    // Sends no CV data; it only asks whether the feature is on.
    fetch("/api/ai/review")
      .then((response) => response.json())
      .then((data: unknown) => {
        const status = StatusSchema.safeParse(data);
        if (status.success) setProvider(status.data.provider);
      })
      .catch(() => {});
  }, []);

  return provider ? <AiReviewDialog provider={provider} onFix={onFix} /> : null;
}

function AiReviewDialog({ provider, onFix }: { provider: string; onFix: (target: CheckTarget) => void }) {
  const resume = resumeStore.useResume((s) => s.resume);
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const fixing = useRef<CheckTarget | null>(null);
  const consentId = useId();

  const payload = buildReviewPayload(resume);
  const serialized = JSON.stringify(payload);
  const reviewable = hasReviewableContent(payload);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const review = await postReview(JSON.stringify({ consent: true, cv: payload }));
      setResult({ review, sent: serialized });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Penilaian AI gagal.");
    } finally {
      setBusy(false);
      setConsent(false); // asked again before the next send
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <Sparkles aria-hidden="true" />
          Penilaian AI
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg"
        onCloseAutoFocus={(event) => {
          const target = fixing.current;
          if (!target) return;
          event.preventDefault();
          fixing.current = null;
          onFix(target);
        }}
      >
        <DialogHeader>
          <DialogTitle>Penilaian AI</DialogTitle>
          <DialogDescription>
            Saran dari AI bisa keliru. Periksa sebelum dipakai, dan jangan menambahkan hal yang tidak
            benar. Ini bukan skor ATS atau jaminan lolos seleksi.
          </DialogDescription>
        </DialogHeader>

        {result && (
          <section aria-label="Saran AI" className="flex flex-col gap-2">
            {result.sent !== serialized && (
              <p className="rounded-lg border border-amber-500/60 bg-amber-50 p-2 text-amber-950">
                CV sudah berubah sejak dinilai.
              </p>
            )}
            <ol className="flex flex-col gap-2">
              {result.review.suggestions.map((item, index) => {
                const label = item.section === "basics" ? "Data diri" : SECTION_LABELS[item.section];
                return (
                  <li key={index} className="flex flex-col gap-1.5 rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">{item.title}</p>
                      <Badge variant="secondary">{label}</Badge>
                    </div>
                    <p className="text-muted-foreground">{item.problem}</p>
                    <p className="whitespace-pre-line">{item.suggestion}</p>
                    <Button
                      variant="outline"
                      className="self-start"
                      aria-label={`Buka ${label} untuk: ${item.title}`}
                      onClick={() => {
                        fixing.current = item.section;
                        setOpen(false);
                      }}
                    >
                      Buka bagian ini
                    </Button>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        <div className="flex flex-col gap-3 rounded-lg bg-muted p-3">
          <p>
            Teks CV akan dikirim lewat server aplikasi ke <strong>{provider}</strong>. Foto, nama,
            email, telepon, alamat, dan tautan dihapus lebih dulu. Nama perusahaan dan sekolah tetap
            dikirim, dan data pribadi yang tertulis di dalam kalimat mungkin tidak terdeteksi.
          </p>
          <details>
            <summary className="cursor-pointer font-medium underline underline-offset-2">
              Lihat data yang akan dikirim
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-md border bg-background p-2 text-xs whitespace-pre-wrap">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </details>
          <div className="flex items-start gap-2">
            <Checkbox
              id={consentId}
              checked={consent}
              disabled={busy}
              onCheckedChange={(checked) => setConsent(checked === true)}
            />
            <Label htmlFor={consentId} className="leading-snug font-normal">
              Saya setuju data di atas dikirim untuk dinilai.
            </Label>
          </div>
          {!reviewable && <p>Isi ringkasan, pengalaman, atau proyek terlebih dahulu.</p>}
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <Button size="lg" disabled={!consent || !reviewable || busy} aria-busy={busy} onClick={send}>
            {busy ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <Sparkles aria-hidden="true" />
            )}
            {busy ? "Sedang menilai…" : result ? "Nilai ulang" : "Kirim dan nilai"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

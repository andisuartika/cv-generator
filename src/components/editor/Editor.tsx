"use client";

import { useEffect, useState } from "react";
import { ResumeForm } from "@/components/editor/ResumeForm";
import { PreviewPane } from "@/components/preview/PreviewPane";
import { Button, ConfirmButton } from "@/components/ui/Button";
import { emptyResume } from "@/lib/defaults";
import { resumeStore, type LoadIssue } from "@/store/resume-store";

const LOAD_MESSAGES: Record<LoadIssue, string> = {
  "corrupt-backed-up":
    "Data CV yang tersimpan rusak dan tidak bisa dibuka. Salinannya sudah dicadangkan di browser ini. Yang tampil sekarang adalah data contoh.",
  "corrupt-locked":
    "Data CV yang tersimpan rusak dan gagal dicadangkan. Agar data lama tidak tertimpa, perubahan saat ini tidak disimpan.",
  unavailable:
    "Penyimpanan browser tidak bisa diakses. Perubahan tidak akan tersimpan setelah halaman ditutup.",
};

const alertClass =
  "rounded-md border border-amber-600 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100";

const TABS = [
  { key: "form", label: "Isi" },
  { key: "preview", label: "Preview" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function Editor() {
  const { ready, loadIssue, saveFailed } = resumeStore.useStatus();
  const revision = resumeStore.useResume((s) => s.revision);
  const resume = resumeStore.useResume((s) => s.resume);
  // Only matters on narrow screens; wide screens show both panels.
  const [tab, setTab] = useState<TabKey>("form");

  useEffect(() => {
    void resumeStore.load();
  }, []);

  if (!ready) {
    return <p role="status">Memuat data…</p>;
  }

  const savingDisabled = loadIssue === "corrupt-locked" || loadIssue === "unavailable";

  function clearResume() {
    const { resume, replaceResume } = resumeStore.useResume.getState();
    const { templateId, theme } = resume;
    replaceResume(structuredClone({ ...emptyResume, templateId, theme }));
  }

  return (
    <div className="flex flex-col gap-4">
      {loadIssue && (
        <p role="alert" className={alertClass}>
          {LOAD_MESSAGES[loadIssue]}
        </p>
      )}
      {saveFailed && (
        <p role="alert" className={alertClass}>
          Perubahan terakhir gagal disimpan, mungkin karena penyimpanan browser penuh. Jangan tutup
          halaman ini sebelum masalahnya teratasi.
        </p>
      )}
      {/* Both panels stay mounted, so switching tabs keeps form and zoom state. */}
      <div
        role="group"
        aria-label="Tampilan editor"
        className="sticky top-0 z-20 flex gap-2 bg-background py-2 lg:hidden"
      >
        {TABS.map(({ key, label }) => (
          <Button
            key={key}
            aria-pressed={tab === key}
            className="flex-1 aria-pressed:bg-foreground aria-pressed:text-background"
            onClick={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
        <div className={`${tab === "form" ? "flex" : "hidden"} flex-col gap-4 lg:flex`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {savingDisabled
                ? "Penyimpanan otomatis tidak aktif."
                : "Data tersimpan di browser ini saja."}
            </p>
            <ConfirmButton label="Kosongkan" confirmLabel="Ya, kosongkan CV" onConfirm={clearResume} />
          </div>
          {/* getState: the form reads the data once per revision, not on each change. */}
          <ResumeForm key={revision} initial={resumeStore.useResume.getState().resume} />
        </div>
        <div
          className={`${tab === "preview" ? "flex" : "hidden"} h-[calc(100dvh-5rem)] flex-col lg:sticky lg:top-4 lg:flex lg:h-[calc(100dvh-2rem)]`}
        >
          <PreviewPane data={resume} />
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  Eye,
  FileText,
  HardDrive,
  PencilLine,
  RotateCcw,
  TriangleAlert,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { AccentPicker } from "@/components/editor/AccentPicker";
import { BackupControls } from "@/components/editor/BackupControls";
import { CvCheck } from "@/components/editor/CvCheck";
import { ResumeForm } from "@/components/editor/ResumeForm";
import { SectionManager } from "@/components/editor/SectionManager";
import { TemplateFromUrl } from "@/components/editor/TemplateFromUrl";
import { TemplatePicker } from "@/components/editor/TemplatePicker";
import { ExportMenu } from "@/components/export/ExportMenu";
import { PreviewPane } from "@/components/preview/PreviewPane";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { emptyResume, sampleResume } from "@/lib/defaults";
import type { CheckTarget } from "@/lib/cv-check";
import type { Resume } from "@/lib/schema";
import { resumeStore, type LoadIssue } from "@/store/resume-store";

const LOAD_MESSAGES: Record<LoadIssue, string> = {
  "corrupt-backed-up":
    "Data CV yang tersimpan rusak dan tidak bisa dibuka. Salinannya sudah dicadangkan di browser ini. Yang tampil sekarang adalah data contoh.",
  "corrupt-locked":
    "Data CV yang tersimpan rusak dan gagal dicadangkan. Agar data lama tidak tertimpa, perubahan saat ini tidak disimpan.",
  unavailable:
    "Penyimpanan browser tidak bisa diakses. Perubahan tidak akan tersimpan setelah halaman ditutup.",
};

function Warning({ children }: { children: string }) {
  return (
    <Alert className="border-amber-500/60 bg-amber-50 text-amber-950 dark:bg-amber-950 dark:text-amber-100">
      <TriangleAlert aria-hidden="true" />
      <AlertDescription className="text-inherit">{children}</AlertDescription>
    </Alert>
  );
}

const TABS = [
  { key: "form", label: "Isi", icon: PencilLine },
  { key: "preview", label: "Preview", icon: Eye },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function Editor() {
  const { ready, loadIssue, saveFailed } = resumeStore.useStatus();
  const revision = resumeStore.useResume((s) => s.revision);
  const resume = resumeStore.useResume((s) => s.resume);
  // Only matters on narrow screens; wide screens show both panels.
  const [tab, setTab] = useState<TabKey>("form");
  const [exportError, setExportError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState("basics");
  const [pages, setPages] = useState<number>();

  useEffect(() => {
    void resumeStore.load();
  }, []);

  if (!ready) {
    return (
      <p role="status" className="p-8 text-center text-muted-foreground">
        Memuat data…
      </p>
    );
  }

  const savingDisabled = loadIssue === "corrupt-locked" || loadIssue === "unavailable";

  /** Replaces the CV content while keeping the chosen template and theme. */
  function replaceContent(source: Resume) {
    const { resume, replaceResume } = resumeStore.useResume.getState();
    const { templateId, theme } = resume;
    replaceResume(structuredClone({ ...source, templateId, theme }));
  }

  /** Opens the panel of a finding and moves focus to it. */
  function showPanel(panel: CheckTarget) {
    setTab("form");
    setOpenPanel(panel);
    // Waits until the accordion and the mobile tab have been updated.
    setTimeout(() => {
      const item = document.querySelector<HTMLElement>(`[data-panel="${panel}"]`);
      item?.querySelector("button")?.focus({ preventScroll: true });
      // The panel, not the button, carries the margin that clears the sticky bars.
      item?.scrollIntoView({ block: "start" });
    }, 250);
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <TemplateFromUrl />
      </Suspense>
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              aria-label="Beranda"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <FileText aria-hidden="true" className="size-5" />
            </Link>
            <h1 className="truncate text-base font-semibold">Editor CV</h1>
          </div>
          {/* Labels are visually hidden on very narrow screens to leave room for the title. */}
          <div className="flex shrink-0 gap-2">
            <ConfirmButton
              variant="outline"
              size="lg"
              title="Isi dengan contoh CV?"
              description="Semua isian saat ini akan diganti dengan data contoh dan tidak bisa dikembalikan."
              confirmLabel="Ya, isi contoh"
              onConfirm={() => replaceContent(sampleResume)}
            >
              <WandSparkles aria-hidden="true" />
              <span className="max-sm:sr-only">Contoh</span>
            </ConfirmButton>
            <ConfirmButton
              variant="outline"
              size="lg"
              title="Kosongkan CV?"
              description="Semua isian CV akan dihapus dan tidak bisa dikembalikan."
              confirmLabel="Ya, kosongkan CV"
              onConfirm={() => replaceContent(emptyResume)}
            >
              <RotateCcw aria-hidden="true" />
              <span className="max-sm:sr-only">Kosongkan</span>
            </ConfirmButton>
            <ExportMenu data={resume} onError={setExportError} onPageCount={setPages} />
          </div>
        </div>
      </header>
      <main className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-4 p-4 lg:px-8 lg:py-6">
          {loadIssue && <Warning>{LOAD_MESSAGES[loadIssue]}</Warning>}
          {exportError && <Warning>{exportError}</Warning>}
          {importError && <Warning>{importError}</Warning>}
          {saveFailed && (
            <Warning>
              Perubahan terakhir gagal disimpan, mungkin karena penyimpanan browser penuh. Jangan
              tutup halaman ini sebelum masalahnya teratasi.
            </Warning>
          )}
          {/* Both panels stay mounted, so switching tabs keeps form and zoom state. */}
          <div
            role="group"
            aria-label="Tampilan editor"
            className="sticky top-18 z-20 grid grid-cols-2 gap-1 rounded-xl border bg-muted p-1 lg:hidden"
          >
            {TABS.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant="ghost"
                size="lg"
                aria-pressed={tab === key}
                className="aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-sm aria-pressed:hover:bg-primary"
                onClick={() => setTab(key)}
              >
                <Icon aria-hidden="true" />
                {label}
              </Button>
            ))}
          </div>
          <div
            className={`${tab === "form" ? "flex" : "hidden"} mx-auto w-full max-w-2xl flex-col gap-4 lg:flex`}
          >
            <div className="flex flex-col gap-3 rounded-2xl border bg-muted p-4">
              <p className="flex items-start gap-2 text-sm">
                <HardDrive aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  {savingDisabled
                    ? "Penyimpanan otomatis tidak aktif."
                    : "Data tersimpan di browser ini saja."}{" "}
                  Ekspor JSON untuk cadangan.{" "}
                  <Link href="/privasi" className="underline underline-offset-2">
                    Kebijakan privasi
                  </Link>
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                <CvCheck pages={pages} onFix={showPanel} />
                <BackupControls onError={setImportError} />
                <SectionManager />
              </div>
            </div>
            {/* getState: the form reads the data once per revision, not on each change. */}
            <ResumeForm
              key={revision}
              initial={resumeStore.useResume.getState().resume}
              openPanel={openPanel}
              onOpenPanelChange={setOpenPanel}
            />
          </div>
        </div>
        <div
          className={`${tab === "preview" ? "flex" : "hidden"} h-[calc(100dvh-8.5rem)] flex-col lg:sticky lg:top-16 lg:flex lg:h-[calc(100dvh-4rem)]`}
        >
          <PreviewPane
            data={resume}
            toolbar={
              <div className="flex gap-2">
                <TemplatePicker
                  value={resume.templateId}
                  onChange={resumeStore.useResume.getState().selectTemplate}
                />
                <AccentPicker
                  value={resume.theme.accent}
                  onChange={resumeStore.useResume.getState().setAccent}
                />
              </div>
            }
          />
        </div>
      </main>
    </div>
  );
}

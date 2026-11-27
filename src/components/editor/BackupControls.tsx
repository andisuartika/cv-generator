"use client";

import { FileDown, FileUp } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { downloadText } from "@/lib/export/download";
import { getExportFileName } from "@/lib/export/filename";
import { MAX_RESUME_FILE_BYTES, parseResumeFile, serializeResume } from "@/lib/resume-file";
import type { Resume } from "@/lib/schema";
import { resumeStore } from "@/store/resume-store";

type BackupControlsProps = {
  onError: (message: string | null) => void;
};

/** JSON backup and restore. */
export function BackupControls({ onError }: BackupControlsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // A valid file waits here until the user confirms replacing the current CV.
  const [pending, setPending] = useState<Resume | null>(null);

  function exportJson() {
    const { resume } = resumeStore.useResume.getState();
    const fileName = `${getExportFileName(resume.basics.name)}.json`;
    downloadText(serializeResume(resume), fileName, "application/json");
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allows choosing the same file again
    if (!file) return;
    onError(null);
    if (file.size > MAX_RESUME_FILE_BYTES) {
      onError("File terlalu besar (maksimal 5 MB). CV Anda tidak diubah.");
      return;
    }
    try {
      const result = parseResumeFile(await file.text());
      if (result.ok) setPending(result.resume);
      else onError(result.message);
    } catch {
      onError("File tidak bisa dibaca. CV Anda tidak diubah.");
    }
  }

  return (
    <>
      <Button variant="outline" size="lg" onClick={exportJson}>
        <FileDown aria-hidden="true" />
        Ekspor JSON
      </Button>
      <Button variant="outline" size="lg" onClick={() => inputRef.current?.click()}>
        <FileUp aria-hidden="true" />
        Impor JSON
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        aria-label="File cadangan CV"
        onChange={handleFile}
      />
      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ganti CV dengan isi file?</AlertDialogTitle>
            <AlertDialogDescription>
              CV milik “{pending?.basics.name || "tanpa nama"}” akan menggantikan semua isian saat
              ini. Ekspor dulu jika CV saat ini masih diperlukan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending) resumeStore.useResume.getState().replaceResume(pending);
              }}
            >
              Ya, ganti CV
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

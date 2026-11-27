"use client";

import { Download, FileImage, FileText, LoaderCircle, Printer } from "lucide-react";
import { useRef, useState } from "react";
import { ExportSheet } from "@/components/export/ExportSheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getExportFileName } from "@/lib/export/filename";
import { downloadImage, type ImageFormat } from "@/lib/export/image";
import { downloadServerPdf } from "@/lib/export/pdf-client";
import { printResume } from "@/lib/export/print";
import type { Resume } from "@/lib/schema";

type ExportMenuProps = {
  data: Resume;
  onError: (message: string | null) => void;
};

export function ExportMenu({ data, onError }: ExportMenuProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function exportPdf() {
    setBusy(true);
    onError(null);
    try {
      await downloadServerPdf(data, getExportFileName(data.basics.name));
    } catch (error) {
      const reason = error instanceof Error ? error.message : "PDF gagal dibuat.";
      onError(`${reason} Anda tetap bisa memakai Cetak / Simpan PDF.`);
    } finally {
      setBusy(false);
    }
  }

  async function exportImage(format: ImageFormat) {
    if (!sheetRef.current) return;
    setBusy(true);
    onError(null);
    try {
      await downloadImage(sheetRef.current, format, getExportFileName(data.basics.name));
    } catch {
      // The error is not logged because it can contain CV content.
      onError("Gambar gagal dibuat. Coba lagi, atau pakai Cetak / Simpan PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="lg" disabled={busy} aria-busy={busy}>
            {busy ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <Download aria-hidden="true" />
            )}
            Unduh
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 max-w-[calc(100vw-2rem)]">
          <DropdownMenuItem aria-label="Unduh PDF" onSelect={() => void exportPdf()}>
            <FileText aria-hidden="true" />
            <span className="flex flex-col">
              Unduh PDF
              <span className="text-xs text-muted-foreground">
                CV dikirim ke server untuk diproses, tidak disimpan
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            aria-label="Cetak / Simpan PDF"
            onSelect={() => void printResume(getExportFileName(data.basics.name))}
          >
            <Printer aria-hidden="true" />
            <span className="flex flex-col">
              Cetak / Simpan PDF
              <span className="text-xs text-muted-foreground">Diproses di browser Anda</span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void exportImage("png")}>
            <FileImage aria-hidden="true" />
            Gambar PNG
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void exportImage("jpg")}>
            <FileImage aria-hidden="true" />
            Gambar JPG
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ExportSheet ref={sheetRef} data={data} />
    </>
  );
}

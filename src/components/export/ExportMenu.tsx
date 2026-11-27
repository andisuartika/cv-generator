"use client";

import { Download, FileImage, FileText, LoaderCircle } from "lucide-react";
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
import { printResume } from "@/lib/export/print";
import type { Resume } from "@/lib/schema";

type ExportMenuProps = {
  data: Resume;
  onError: (message: string | null) => void;
};

export function ExportMenu({ data, onError }: ExportMenuProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

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
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem onSelect={() => void printResume(getExportFileName(data.basics.name))}>
            <FileText aria-hidden="true" />
            Cetak / Simpan PDF
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

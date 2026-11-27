"use client";

import { CircleAlert, CircleCheck, Lightbulb, ListChecks } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { checkResume, type CheckTarget, type Finding } from "@/lib/cv-check";
import { resumeStore } from "@/store/resume-store";

const GROUPS = [
  { severity: "important", title: "Perlu diperbaiki", icon: CircleAlert, tone: "text-destructive" },
  { severity: "suggestion", title: "Saran", icon: Lightbulb, tone: "text-amber-700" },
] as const;

type CvCheckProps = {
  /** Estimated page count of the CV, if known. */
  pages?: number;
  onFix: (target: CheckTarget) => void;
};

/** Automatic review that runs entirely in the browser. */
export function CvCheck({ pages, onFix }: CvCheckProps) {
  const resume = resumeStore.useResume((s) => s.resume);
  const findings = useMemo(() => checkResume(resume, { pages }), [resume, pages]);
  const [open, setOpen] = useState(false);
  // Set when closing to go to a panel, so that focus does not jump back to the trigger.
  const fixing = useRef<CheckTarget | null>(null);

  function renderFinding(finding: Finding) {
    return (
      <li key={finding.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="font-medium">{finding.title}</p>
          <p className="text-muted-foreground">{finding.detail}</p>
        </div>
        <Button
          variant="outline"
          aria-label={`Perbaiki: ${finding.title}`}
          onClick={() => {
            fixing.current = finding.target;
            setOpen(false);
          }}
        >
          Perbaiki
        </Button>
      </li>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <ListChecks aria-hidden="true" />
          Cek CV
          {findings.length > 0 && (
            <Badge variant="secondary" aria-label={`${findings.length} temuan`}>
              {findings.length}
            </Badge>
          )}
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
          <DialogTitle>Cek CV otomatis</DialogTitle>
          <DialogDescription>
            Diperiksa di browser Anda, tidak ada data yang dikirim. Yang dicek hanya kelengkapan,
            format, dan kebiasaan penulisan. Ini bukan penilaian mutu isi atau jaminan lolos seleksi.
          </DialogDescription>
        </DialogHeader>
        {findings.length === 0 && (
          <p className="flex items-start gap-2 rounded-lg border p-3">
            <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            Tidak ada masalah yang terdeteksi oleh pemeriksaan otomatis.
          </p>
        )}
        {GROUPS.map(({ severity, title, icon: Icon, tone }) => {
          const group = findings.filter((f) => f.severity === severity);
          if (group.length === 0) return null;
          return (
            <section key={severity} className="flex flex-col gap-2">
              <h3 className={`flex items-center gap-1.5 font-semibold ${tone}`}>
                <Icon aria-hidden="true" className="size-4" />
                {title} ({group.length})
              </h3>
              <ul className="flex flex-col gap-2">{group.map(renderFinding)}</ul>
            </section>
          );
        })}
      </DialogContent>
    </Dialog>
  );
}

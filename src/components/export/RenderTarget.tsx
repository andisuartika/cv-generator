"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { ExportSheet } from "@/components/export/ExportSheet";
import { PDF_DATA_GLOBAL, PDF_READY_ATTRIBUTE } from "@/lib/pdf/contract";
import { ResumeSchema } from "@/lib/schema";

const subscribe = () => () => {};
const readData = () => (window as unknown as Record<string, string | undefined>)[PDF_DATA_GLOBAL];

async function markReady(node: HTMLElement) {
  node.getBoundingClientRect(); // layout first, so that the needed fonts are requested
  await document.fonts.ready;
  await Promise.all([...node.querySelectorAll("img")].map((img) => img.decode().catch(() => {})));
  document.body.setAttribute(PDF_READY_ATTRIBUTE, "true");
}

/** Renders the injected resume with the same markup as the browser export. */
export function RenderTarget() {
  const raw = useSyncExternalStore(subscribe, readData, () => undefined);
  const resume = useMemo(() => {
    if (!raw) return null;
    const parsed = ResumeSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  }, [raw]);

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (node) void markReady(node);
  }, []);

  return resume ? <ExportSheet ref={ref} data={resume} /> : null;
}

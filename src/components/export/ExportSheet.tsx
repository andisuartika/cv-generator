"use client";

import { useEffect, useRef, type Ref } from "react";
import { createPortal } from "react-dom";
import { A4Canvas } from "@/components/preview/A4Canvas";
import { getPageCount } from "@/lib/preview";
import type { Resume } from "@/lib/schema";
import { getTemplate, templates } from "@/templates/registry";

/**
 * A full-size, off-screen copy of the CV used for export. The visible preview
 * is scaled and can be hidden (mobile tabs), so it cannot be captured reliably.
 * It uses the same template component as the preview.
 */
type ExportSheetProps = {
  data: Resume;
  ref: Ref<HTMLDivElement>;
  /** Reports the estimated number of A4 pages. */
  onPageCount?: (pages: number) => void;
};

export function ExportSheet({ data, ref, onPageCount }: ExportSheetProps) {
  const Template = (getTemplate(data.templateId) ?? templates[0]).component;
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !onPageCount) return;
    const observer = new ResizeObserver(() => onPageCount(getPageCount(wrapper.offsetHeight)));
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [onPageCount]);

  return createPortal(
    <div ref={wrapperRef} className="export-sheet" aria-hidden="true" inert>
      <A4Canvas ref={ref}>
        <Template data={data} />
      </A4Canvas>
    </div>,
    document.body,
  );
}

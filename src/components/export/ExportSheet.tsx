"use client";

import type { Ref } from "react";
import { createPortal } from "react-dom";
import { A4Canvas } from "@/components/preview/A4Canvas";
import type { Resume } from "@/lib/schema";
import { getTemplate, templates } from "@/templates/registry";

/**
 * A full-size, off-screen copy of the CV used for export. The visible preview
 * is scaled and can be hidden (mobile tabs), so it cannot be captured reliably.
 * It uses the same template component as the preview.
 */
export function ExportSheet({ data, ref }: { data: Resume; ref: Ref<HTMLDivElement> }) {
  const Template = (getTemplate(data.templateId) ?? templates[0]).component;
  return createPortal(
    <div className="export-sheet" aria-hidden="true" inert>
      <A4Canvas ref={ref}>
        <Template data={data} />
      </A4Canvas>
    </div>,
    document.body,
  );
}

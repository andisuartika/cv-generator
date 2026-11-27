"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { resumeStore } from "@/store/resume-store";
import { getTemplate } from "@/templates/registry";

/**
 * Applies /builder?t=<id> once, then removes the parameter so that a reload
 * does not override a template chosen later. Mount only after data has loaded.
 */
export function TemplateFromUrl() {
  const requested = useSearchParams().get("t");

  useEffect(() => {
    if (requested === null) return;
    if (getTemplate(requested)) {
      resumeStore.useResume.getState().selectTemplate(requested);
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("t");
    window.history.replaceState(null, "", url);
  }, [requested]);

  return null;
}

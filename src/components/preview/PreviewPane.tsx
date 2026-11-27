"use client";

import { Maximize2, Minus, Plus } from "lucide-react";
import { useDeferredValue, useEffect, useRef, useState, type ReactNode } from "react";
import { A4Canvas } from "@/components/preview/A4Canvas";
import { Button } from "@/components/ui/button";
import {
  A4_HEIGHT,
  A4_WIDTH,
  getFitScale,
  getPageCount,
  stepZoom,
  ZOOM_STEPS,
} from "@/lib/preview";
import type { Resume } from "@/lib/schema";
import { getTemplate, templates } from "@/templates/registry";

type PreviewPaneProps = {
  data: Resume;
  /** Extra controls shown at the start of the toolbar. */
  toolbar?: ReactNode;
};

export function PreviewPane({ data, toolbar }: PreviewPaneProps) {
  // Lets typing stay responsive while the preview catches up.
  const deferred = useDeferredValue(data);
  const Template = (getTemplate(deferred.templateId) ?? templates[0]).component;

  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(A4_HEIGHT);
  const [zoom, setZoom] = useState<number | "fit">("fit");

  useEffect(() => {
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    if (!viewport || !canvas) return;
    const observer = new ResizeObserver(() => {
      // Both sizes are 0 while the pane is hidden behind the mobile tab.
      if (viewport.clientWidth === 0) return;
      const style = getComputedStyle(viewport);
      const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      setFitScale(getFitScale(viewport.clientWidth - padding));
      // offsetHeight ignores the CSS transform, so this is the unscaled height.
      setContentHeight(canvas.offsetHeight);
    });
    observer.observe(viewport);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const scale = zoom === "fit" ? fitScale : zoom;
  const pages = getPageCount(contentHeight);

  return (
    <section
      aria-label="Preview CV"
      className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted lg:border-l"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-background px-4 py-2">
        <div className="flex items-center gap-3">
          {toolbar}
          <p role="status" className="text-sm font-medium text-muted-foreground">
            {pages === 1 ? "1 halaman" : `Sekitar ${pages} halaman`}
          </p>
        </div>
        <div role="group" aria-label="Zoom preview" className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Perkecil"
            disabled={scale <= ZOOM_STEPS[0]}
            onClick={() => setZoom(stepZoom(scale, -1))}
          >
            <Minus aria-hidden="true" />
          </Button>
          <span className="w-12 text-center text-sm tabular-nums">{Math.round(scale * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Perbesar"
            disabled={scale >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
            onClick={() => setZoom(stepZoom(scale, 1))}
          >
            <Plus aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            aria-pressed={zoom === "fit"}
            className="ml-1 aria-pressed:border-primary aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
            onClick={() => setZoom("fit")}
          >
            <Maximize2 aria-hidden="true" />
            Pas lebar
          </Button>
        </div>
      </div>
      <div
        ref={viewportRef}
        tabIndex={0}
        className="min-h-0 flex-1 overflow-auto p-4 [scrollbar-gutter:stable] lg:p-6"
      >
        {/* The wrapper takes the scaled size, because transform does not affect layout. */}
        <div
          className="relative mx-auto overflow-hidden"
          style={{ width: A4_WIDTH * scale, height: contentHeight * scale }}
        >
          {/* Links are disabled so a click cannot leave the editor. */}
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{ width: A4_WIDTH, transform: `scale(${scale})` }}
            onClickCapture={(e) => e.preventDefault()}
          >
            <A4Canvas ref={canvasRef}>
              <Template data={deferred} />
            </A4Canvas>
          </div>
          {/* Page markers sit outside the canvas, so exports will not include them. */}
          {Array.from({ length: pages - 1 }, (_, index) => (
            <div
              key={index}
              data-page-break
              className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-red-500"
              style={{ top: A4_HEIGHT * (index + 1) * scale }}
            >
              <span className="absolute right-0 bottom-0 bg-red-600 px-1.5 text-xs text-white">
                Batas halaman {index + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
      {pages > 1 && (
        <p className="border-t bg-background px-4 py-2 text-xs text-muted-foreground">
          Garis batas halaman hanya perkiraan. Posisi potongan saat dicetak bisa berbeda.
        </p>
      )}
    </section>
  );
}

"use client";

import { useCallback, useId, useRef, useState, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DEFAULT_CROP, dragCrop, drawCrop, encodePhoto, MAX_ZOOM } from "@/lib/image-utils";

type PhotoCropDialogProps = {
  image: ImageBitmap;
  onApply: (photo: string) => void;
  onCancel: () => void;
};

type SliderProps = {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
};

function Slider({ label, onChange, ...input }: SliderProps) {
  const id = useId();
  return (
    <div className="grid grid-cols-[5.5rem_1fr] items-center gap-2">
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
      <input
        {...input}
        id={id}
        type="range"
        step={0.01}
        className="h-6 w-full accent-primary"
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function PhotoCropDialog({ image, onApply, onCancel }: PhotoCropDialogProps) {
  const [crop, setCrop] = useState(DEFAULT_CROP);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  // A new callback whenever the crop changes makes React draw the preview again.
  const draw = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (canvas) drawCrop(canvas, image, crop);
    },
    [image, crop],
  );

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const start = dragStart.current;
    if (!start) return;
    const delta = { x: event.clientX - start.x, y: event.clientY - start.y };
    dragStart.current = { x: event.clientX, y: event.clientY };
    const size = event.currentTarget.clientWidth;
    setCrop((current) => dragCrop(current, image, delta, size));
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atur foto</DialogTitle>
          <DialogDescription>
            Geser foto atau pakai penggeser. Foto diproses di browser dan tidak diunggah.
          </DialogDescription>
        </DialogHeader>
        <canvas
          ref={draw}
          width={400}
          height={400}
          role="img"
          aria-label="Pratinjau potongan foto"
          className="mx-auto aspect-square w-full max-w-64 cursor-grab touch-none rounded-lg border active:cursor-grabbing"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            dragStart.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={() => (dragStart.current = null)}
          onPointerCancel={() => (dragStart.current = null)}
        />
        <Slider
          label="Perbesar"
          min={1}
          max={MAX_ZOOM}
          value={crop.zoom}
          onChange={(zoom) => setCrop((c) => ({ ...c, zoom }))}
        />
        <Slider
          label="Mendatar"
          min={0}
          max={1}
          value={crop.x}
          onChange={(x) => setCrop((c) => ({ ...c, x }))}
        />
        <Slider
          label="Tegak"
          min={0}
          max={1}
          value={crop.y}
          onChange={(y) => setCrop((c) => ({ ...c, y }))}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button onClick={() => onApply(encodePhoto(image, crop))}>Pakai foto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

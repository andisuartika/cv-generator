"use client";

import { ImagePlus, Trash2, UserRound } from "lucide-react";
import { useId, useRef, useState, type ChangeEvent } from "react";
import { useController, useFormContext } from "react-hook-form";
import { PhotoCropDialog } from "@/components/editor/PhotoCropDialog";
import { Button } from "@/components/ui/button";
import { isSafePhoto, PHOTO_TYPES, readPhotoFile } from "@/lib/image-utils";
import type { Resume } from "@/lib/schema";
import { resumeStore } from "@/store/resume-store";
import { getTemplate, templates } from "@/templates/registry";

export function PhotoField() {
  const { control } = useFormContext<Resume>();
  const {
    field: { value, onChange },
  } = useController({ control, name: "basics.photo" });
  const templateId = resumeStore.useResume((s) => s.resume.templateId);
  const template = getTemplate(templateId) ?? templates[0];

  const inputRef = useRef<HTMLInputElement>(null);
  const headingId = useId();
  const [image, setImage] = useState<ImageBitmap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasPhoto = isSafePhoto(value);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allows choosing the same file again
    if (!file) return;
    setError(null);
    try {
      setImage(await readPhotoFile(file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Foto tidak bisa dibaca.");
    }
  }

  return (
    <div role="group" aria-labelledby={headingId} className="flex items-center gap-4">
      <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-muted-foreground">
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Foto saat ini" className="size-full object-cover" />
        ) : (
          <UserRound aria-hidden="true" className="size-8" />
        )}
      </span>
      <div className="flex min-w-0 flex-col gap-2">
        <p id={headingId} className="text-sm font-medium">
          Foto <span className="font-normal text-muted-foreground">(opsional)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="lg" onClick={() => inputRef.current?.click()}>
            <ImagePlus aria-hidden="true" />
            {hasPhoto ? "Ganti foto" : "Pilih foto"}
          </Button>
          {hasPhoto && (
            // An empty string: react-hook-form would restore the default for undefined.
            <Button variant="ghost" size="lg" onClick={() => onChange("")}>
              <Trash2 aria-hidden="true" />
              Hapus foto
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={PHOTO_TYPES.join(",")}
          className="hidden"
          aria-label="File foto"
          onChange={handleFile}
        />
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        {!template.supports.photo && (
          <p className="text-xs text-muted-foreground">
            Template {template.name} tidak menampilkan foto.
          </p>
        )}
      </div>
      {image && (
        <PhotoCropDialog
          image={image}
          onCancel={() => setImage(null)}
          onApply={(photo) => {
            onChange(photo);
            setImage(null);
          }}
        />
      )}
    </div>
  );
}

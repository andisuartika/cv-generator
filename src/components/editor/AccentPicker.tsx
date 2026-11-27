"use client";

import { Check } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Dark enough to stay readable as heading text on white paper. */
const PRESETS = [
  { name: "Biru", value: "#2563eb" },
  { name: "Biru tua", value: "#1e3a8a" },
  { name: "Hijau", value: "#047857" },
  { name: "Ungu", value: "#6d28d9" },
  { name: "Merah", value: "#b91c1c" },
  { name: "Oranye", value: "#c2410c" },
  { name: "Abu gelap", value: "#334155" },
  { name: "Hitam", value: "#171717" },
];

type AccentPickerProps = {
  value: string;
  onChange: (accent: string) => void;
};

export function AccentPicker({ value, onChange }: AccentPickerProps) {
  const customId = useId();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-label="Warna aksen CV">
          <span
            aria-hidden="true"
            className="size-4 rounded-full border"
            style={{ backgroundColor: value }}
          />
          Warna
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" aria-label="Pilih warna aksen" className="w-60 gap-3 p-3">
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((preset) => {
            const selected = preset.value === value.toLowerCase();
            return (
              <button
                key={preset.value}
                type="button"
                aria-label={preset.name}
                aria-pressed={selected}
                title={preset.name}
                onClick={() => onChange(preset.value)}
                className="flex size-11 items-center justify-center rounded-full text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                style={{ backgroundColor: preset.value }}
              >
                {selected && <Check aria-hidden="true" className="size-5" />}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={customId} className="text-sm">
            Warna lain
          </label>
          <input
            id={customId}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-14 cursor-pointer rounded-md border bg-background p-1"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

import type { ComponentType } from "react";
import type { Resume } from "@/lib/schema";
import { BannerTemplate } from "@/templates/banner";
import { ClassicTemplate } from "@/templates/classic";
import { CompactTemplate } from "@/templates/compact";
import { MinimalTemplate } from "@/templates/minimal";
import { ModernTemplate } from "@/templates/modern";
import { TimelineTemplate } from "@/templates/timeline";

export type TemplateDef = {
  id: string;
  name: string;
  thumbnail: string; // small gallery image
  component: ComponentType<{ data: Resume }>;
  defaultTheme: Resume["theme"];
  supports: { photo: boolean; sidebar: boolean };
};

function define(
  id: string,
  name: string,
  component: TemplateDef["component"],
  supports: Partial<TemplateDef["supports"]> = {},
): TemplateDef {
  return {
    id,
    name,
    component,
    thumbnail: `/thumbnails/${id}.svg`,
    defaultTheme: { accent: "#2563eb", font: "Inter", fontSize: 10.5 },
    supports: { photo: false, sidebar: false, ...supports },
  };
}

/** All available templates, in gallery order. */
export const templates: TemplateDef[] = [
  define("classic", "Classic", ClassicTemplate, { photo: true }),
  define("modern", "Modern", ModernTemplate, { photo: true, sidebar: true }),
  define("minimal", "Minimal", MinimalTemplate),
  define("banner", "Banner", BannerTemplate, { photo: true }),
  define("timeline", "Timeline", TimelineTemplate, { photo: true }),
  define("compact", "Compact", CompactTemplate),
];

export function getTemplate(id: string): TemplateDef | undefined {
  return templates.find((t) => t.id === id);
}

import type { ComponentType } from "react";
import type { Resume } from "@/lib/schema";
import { ClassicTemplate } from "@/templates/classic";
import { ModernTemplate } from "@/templates/modern";

export type TemplateDef = {
  id: string;
  name: string;
  thumbnail: string; // small gallery image
  component: ComponentType<{ data: Resume }>;
  defaultTheme: Resume["theme"];
  supports: { photo: boolean; sidebar: boolean };
};

const classic: TemplateDef = {
  id: "classic",
  name: "Classic",
  thumbnail: "/thumbnails/classic.svg",
  component: ClassicTemplate,
  defaultTheme: { accent: "#2563eb", font: "Inter", fontSize: 10.5 },
  supports: { photo: true, sidebar: false },
};

const modern: TemplateDef = {
  id: "modern",
  name: "Modern",
  thumbnail: "/thumbnails/modern.svg",
  component: ModernTemplate,
  defaultTheme: { accent: "#2563eb", font: "Inter", fontSize: 10.5 },
  supports: { photo: true, sidebar: true },
};

/** All available templates. */
export const templates: TemplateDef[] = [classic, modern];

export function getTemplate(id: string): TemplateDef | undefined {
  return templates.find((t) => t.id === id);
}

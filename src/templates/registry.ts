import type { ComponentType } from "react";
import type { Resume } from "@/lib/schema";
import { ClassicTemplate } from "@/templates/classic";

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

/** All available templates. Modern and Minimal arrive in Phase 5. */
export const templates: TemplateDef[] = [classic];

export function getTemplate(id: string): TemplateDef | undefined {
  return templates.find((t) => t.id === id);
}

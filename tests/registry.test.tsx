import { existsSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { emptyResume, sampleResume } from "@/lib/defaults";
import { ResumeSchema } from "@/lib/schema";
import { getTemplate, templates } from "@/templates/registry";

describe("template registry", () => {
  it("punya id unik dan memuat template bawaan data", () => {
    const ids = templates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(getTemplate(emptyResume.templateId)).toBeDefined();
    expect(getTemplate("tidak-ada")).toBeUndefined();
  });

  // Runs for every registered template, so new ones are covered automatically.
  it.each(templates)("$name: lengkap dan bisa dirender", (template) => {
    expect(existsSync(path.join("public", template.thumbnail))).toBe(true);
    expect(ResumeSchema.shape.theme.safeParse(template.defaultTheme).success).toBe(true);
    const Component = template.component;
    expect(renderToStaticMarkup(<Component data={sampleResume} />)).toContain(sampleResume.basics.name);
    expect(renderToStaticMarkup(<Component data={emptyResume} />)).not.toMatch(/<(h1|h2|section)\b/);
  });
});

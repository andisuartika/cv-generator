import { existsSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { emptyResume, sampleResume } from "@/lib/defaults";
import { ResumeSchema, type Resume } from "@/lib/schema";
import { SECTION_LABELS } from "@/lib/sections";
import { getTemplate, templates } from "@/templates/registry";

const photo = "data:image/png;base64,AAAA";

const longResume: Resume = {
  ...sampleResume,
  experience: Array.from({ length: 10 }, (_, i) => ({
    ...sampleResume.experience[0],
    id: `long-${i}`,
    role: `Posisi ${i}`,
    bullets: Array.from({ length: 8 }, (_, j) => `Poin ${i}-${j} ${"panjang ".repeat(20)}`),
  })),
};

describe("template registry", () => {
  it("punya id unik dan memuat template bawaan data", () => {
    const ids = templates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
      "classic", "modern", "minimal", "banner", "timeline",
      "compact", "editorial", "bold", "accent", "executive",
    ]);
    expect(new Set(templates.map((t) => t.thumbnail)).size).toBe(10);
    expect(new Set(templates.map((t) => t.component)).size).toBe(10);
    expect(getTemplate(emptyResume.templateId)).toBeDefined();
    expect(getTemplate("tidak-ada")).toBeUndefined();
  });
});

// Runs for every registered template, so new ones are covered automatically.
describe.each(templates)("template $name", (template) => {
  const Component = template.component;
  const render = (data: Resume) => renderToStaticMarkup(<Component data={data} />);
  const headings = (html: string) =>
    [...html.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].map((m) => m[1]);
  const labels: string[] = Object.values(SECTION_LABELS);
  const sectionHeadings = (html: string) => headings(html).filter((h) => labels.includes(h));

  it("punya thumbnail dan tema bawaan yang valid", () => {
    expect(existsSync(path.join("public", template.thumbnail))).toBe(true);
    expect(ResumeSchema.shape.theme.safeParse(template.defaultTheme).success).toBe(true);
  });

  it("tidak menampilkan label atau bagian kosong untuk CV kosong", () => {
    expect(render(emptyResume)).not.toMatch(/<(header|aside|section|h1|h2|ul|img)\b/);
  });

  it("menampilkan semua section dan isinya", () => {
    const html = render(sampleResume);
    expect(sectionHeadings(html).sort()).toEqual([...labels].sort());
    for (const text of ["Putu Contoh Nama", "PT Contoh Teknologi", "Universitas Contoh", "Flutter", "Aplikasi Contoh", "Inggris", "contoh@email.com"]) {
      expect(html).toContain(text);
    }
  });

  it("menampilkan seluruh data panjang", () => {
    const html = render(longResume);
    expect(html).toContain("Posisi 9");
    expect(html).toContain("Poin 9-7");
  });

  it("menghormati hiddenSections dan urutan", () => {
    const html = render({
      ...sampleResume,
      sectionOrder: ["education", "experience", "languages", "skills"],
      hiddenSections: ["languages"],
    });
    expect(sectionHeadings(html)).toEqual(
      ["Pendidikan", "Pengalaman", "Keahlian"],
    );
  });

  it("rapi tanpa foto, dan menampilkan foto hanya jika didukung", () => {
    expect(render(sampleResume)).not.toContain("<img");
    const html = render({ ...sampleResume, basics: { ...sampleResume.basics, photo } });
    expect(html.includes(photo)).toBe(template.supports.photo);
  });

  it("tidak membuat tautan berbahaya", () => {
    const html = render({ ...sampleResume, basics: { ...sampleResume.basics, website: "javascript:alert(1)" } });
    expect(html).not.toContain('href="javascript:');
  });
});

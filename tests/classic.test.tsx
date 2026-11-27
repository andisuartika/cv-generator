import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { emptyResume, sampleResume } from "@/lib/defaults";
import type { Resume } from "@/lib/schema";
import { SECTION_LABELS } from "@/lib/sections";
import { ClassicTemplate } from "@/templates/classic";

const render = (data: Resume) => renderToStaticMarkup(<ClassicTemplate data={data} />);
const headings = (html: string) =>
  [...html.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].map((m) => m[1]);

describe("ClassicTemplate", () => {
  it("menampilkan semua section data contoh sesuai urutan", () => {
    expect(headings(render(sampleResume))).toEqual(Object.values(SECTION_LABELS));
  });

  it("tidak menampilkan header, section, atau daftar untuk CV kosong", () => {
    expect(render(emptyResume)).not.toMatch(/<(header|section|h1|h2|ul|img)\b/);
  });

  it("melewati item yang isinya hanya spasi", () => {
    const html = render({
      ...emptyResume,
      basics: { name: " ", summary: "  " },
      experience: [{ id: "a", company: "", role: " ", start: "", current: true, bullets: [""] }],
      education: [{ id: "b", school: "", degree: "", start: "" }],
      skills: [{ id: "c", group: "Bahasa", items: [" "] }],
      projects: [{ id: "d", name: "" }],
      certificates: [{ id: "e", name: "" }],
      languages: [{ id: "f", name: "" }],
    });
    expect(html).not.toMatch(/<(header|section|h1|h2|ul)\b/);
  });

  it("menghormati sectionOrder dan hiddenSections", () => {
    const html = render({
      ...sampleResume,
      sectionOrder: ["skills", "tidak-ada", "summary", "skills", "experience"],
      hiddenSections: ["summary"],
    });
    expect(headings(html)).toEqual([SECTION_LABELS.skills, SECTION_LABELS.experience]);
  });

  it("memakai warna aksen, font, dan ukuran dari theme", () => {
    const html = render({ ...sampleResume, theme: { accent: "#ff0000", font: "Inter", fontSize: 11 } });
    expect(html).toContain("--accent:#ff0000");
    expect(html).toContain("font-size:11pt");
    expect(html).toContain("Inter");
  });

  it("menampilkan foto hanya jika ada", () => {
    expect(render(sampleResume)).not.toContain("<img");
    const photo = "data:image/png;base64,AAAA";
    expect(render({ ...sampleResume, basics: { ...sampleResume.basics, photo } })).toContain(photo);
  });
});

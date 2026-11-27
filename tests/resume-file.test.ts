import { describe, expect, it } from "vitest";
import { emptyResume, sampleResume } from "@/lib/defaults";
import { parseResumeFile, serializeResume } from "@/lib/resume-file";
import { SECTION_KEYS, type Resume } from "@/lib/schema";

function parsed(data: Resume) {
  const result = parseResumeFile(serializeResume(data));
  if (!result.ok) throw new Error(result.message);
  return result.resume;
}

describe("cadangan JSON", () => {
  it("memulihkan data yang diekspor tanpa perubahan", () => {
    expect(parsed(sampleResume)).toEqual(sampleResume);
  });

  it("menolak file rusak atau bukan CV dengan pesan", () => {
    for (const text of ["", "{rusak", "null", "[]", '{"a":1}', JSON.stringify({ ...sampleResume, version: 2 })]) {
      const result = parseResumeFile(text);
      expect(result.ok, text).toBe(false);
      if (!result.ok) expect(result.message).toContain("tidak diubah");
    }
  });

  it("membuang foto dari alamat luar, warna, dan font yang tidak aman", () => {
    const resume = parsed({
      ...sampleResume,
      theme: { accent: "url(https://pelacak.example)", font: 'x", url(a)', fontSize: 10 },
      basics: { ...sampleResume.basics, photo: "https://pelacak.example/foto.png" },
    });
    expect(resume.theme).toEqual({ accent: emptyResume.theme.accent, font: "Inter", fontSize: 10 });
    expect(resume.basics.photo).toBeUndefined();
    expect(parsed({ ...sampleResume, basics: { name: "", photo: "data:image/svg+xml;base64,AAAA" } }).basics.photo).toBeUndefined();
  });

  it("memperbaiki id ganda serta urutan section yang tidak lengkap", () => {
    const [first] = sampleResume.experience;
    const resume = parsed({
      ...sampleResume,
      experience: [first, { ...first }, { ...first, id: "" }],
      sectionOrder: ["skills", "ngawur", "skills"],
      hiddenSections: ["languages", "ngawur", "languages"],
    });
    expect(new Set(resume.experience.map((e) => e.id)).size).toBe(3);
    expect(resume.experience[0].id).toBe(first.id);
    expect(resume.sectionOrder[0]).toBe("skills");
    expect([...resume.sectionOrder].sort()).toEqual([...SECTION_KEYS].sort());
    expect(resume.hiddenSections).toEqual(["languages"]);
  });
});

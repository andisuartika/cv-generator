import { describe, expect, it } from "vitest";
import { checkResume, MAX_BULLET_LENGTH } from "@/lib/cv-check";
import { emptyResume, sampleResume } from "@/lib/defaults";
import type { Resume } from "@/lib/schema";

const ids = (resume: Resume, pages?: number) => checkResume(resume, { pages }).map((f) => f.id);

const job = (overrides: Partial<Resume["experience"][number]>) => ({
  ...sampleResume.experience[0],
  ...overrides,
});

describe("cek CV", () => {
  it("hanya menyarankan angka pada pengalaman contoh yang belum punya angka", () => {
    expect(ids(sampleResume, 1)).toEqual(["experience-1-numbers"]);
  });

  it("menandai hal pokok pada CV kosong, yang penting lebih dulu", () => {
    const findings = checkResume(emptyResume);
    expect(findings.map((f) => f.id)).toEqual([
      "name", "contact", "no-experience", "title", "summary-empty", "no-education", "no-skills",
    ]);
    expect(findings.slice(0, 3).every((f) => f.severity === "important")).toBe(true);
  });

  it("menganggap proyek cukup bila belum ada pengalaman", () => {
    expect(ids({ ...sampleResume, experience: [] })).not.toContain("no-experience");
  });

  it("memeriksa tanggal dan poin dengan nomor sesuai editor", () => {
    const blank = { id: "x", company: "", role: "", start: "", current: false, bullets: [" "] };
    const found = checkResume({
      ...sampleResume,
      experience: [
        blank,
        job({
          id: "y",
          current: false,
          start: "2024-05",
          end: "2023-01",
          bullets: ["Bertanggung jawab atas laporan", "", "Saya menyusun jadwal", "x".repeat(MAX_BULLET_LENGTH + 1)],
        }),
      ],
    });
    expect(found.map((f) => f.id)).toEqual([
      "experience-1-order", "experience-1-long", "experience-1-weak", "experience-1-person", "experience-1-numbers",
    ]);
    expect(found[0].title).toContain("Pengalaman 2");
    expect(found.find((f) => f.id === "experience-1-person")?.detail).toContain("Poin 2 ");
  });

  it("tidak salah menandai kata yang hanya mengandung 'saya' atau 'aku'", () => {
    const resume = { ...sampleResume, experience: [job({ bullets: ["Menyayangi 2 sayap pesawat dan akuntansi"] })] };
    expect(ids(resume)).toEqual([]);
  });

  it("memakai aturan format yang sama dengan editor", () => {
    const found = ids({
      ...sampleResume,
      basics: { ...sampleResume.basics, email: "salah@" },
      experience: [job({ start: "2024", end: "abc", current: true, bullets: ["Naik 5%"] })],
    });
    expect(found).toEqual(["format-email", "format-experience-0-start"]);
  });

  it("tidak memeriksa section yang disembunyikan", () => {
    const resume: Resume = {
      ...emptyResume,
      basics: { name: "A", title: "B", email: "a@contoh.com" },
      hiddenSections: ["summary", "education", "skills"],
      projects: [{ id: "p", name: "Proyek" }],
    };
    expect(ids(resume)).toEqual([]);
  });

  it("menandai poin kembar dan CV lebih dari dua halaman", () => {
    const resume = {
      ...sampleResume,
      experience: [job({ id: "a", bullets: ["Naik 5%"] }), job({ id: "b", bullets: ["naik 5% "] })],
    };
    expect(ids(resume, 3)).toEqual(["duplicate-bullets", "pages"]);
    expect(ids(resume, 2)).toEqual(["duplicate-bullets"]);
  });

  it("memberi id unik pada setiap temuan", () => {
    const resume = { ...emptyResume, experience: [job({ id: "a", role: "", bullets: [] }), job({ id: "b", role: "", bullets: [] })] };
    const found = ids(resume);
    expect(new Set(found).size).toBe(found.length);
  });
});

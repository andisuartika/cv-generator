import { describe, expect, it } from "vitest";
import { emptyResume, sampleResume } from "@/lib/defaults";
import { ResumeFormSchema } from "@/lib/form-schema";
import { newCertificate, newEducation, newExperience, newLanguage, newProject, newSkillGroup, parseList } from "@/lib/items";
import { ResumeSchema } from "@/lib/schema";

const withItems = {
  ...emptyResume,
  experience: [newExperience()],
  education: [newEducation()],
  skills: [newSkillGroup()],
  projects: [newProject()],
  certificates: [newCertificate()],
  languages: [newLanguage()],
};

describe("ResumeFormSchema", () => {
  it("tidak memberi peringatan pada data contoh, kosong, dan item baru", () => {
    for (const data of [sampleResume, emptyResume, withItems]) {
      expect(ResumeFormSchema.safeParse(data).success).toBe(true);
    }
  });

  it("memberi peringatan untuk email, alamat web, dan tanggal yang salah", () => {
    const data = {
      ...withItems,
      basics: { name: "", email: "salah@", website: "bukan alamat" },
      experience: [{ ...newExperience(), start: "2024", end: "2024-13" }],
    };
    const result = ResumeFormSchema.safeParse(data);
    expect(result.error?.issues.map((i) => i.path.join("."))).toEqual([
      "basics.email", "basics.website", "experience.0.start", "experience.0.end",
    ]);
    // The same data must still be storable.
    expect(ResumeSchema.safeParse(data).success).toBe(true);
  });

  it("memecah daftar yang dipisah koma", () => {
    expect(parseList(" TypeScript, Dart,, PHP , ")).toEqual(["TypeScript", "Dart", "PHP"]);
  });
});

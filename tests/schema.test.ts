import { describe, expect, it } from "vitest";
import { ResumeSchema, type Resume } from "@/lib/schema";
import { emptyResume, sampleResume } from "@/lib/defaults";

describe("ResumeSchema", () => {
  it("menerima data contoh", () => {
    expect(ResumeSchema.safeParse(sampleResume).success).toBe(true);
  });

  it("menerima CV kosong", () => {
    expect(ResumeSchema.safeParse(emptyResume).success).toBe(true);
  });

  it("menolak data tanpa versi", () => {
    const data: Partial<Resume> = { ...sampleResume };
    delete data.version;
    expect(ResumeSchema.safeParse(data).success).toBe(false);
  });

  it("setiap item array punya id unik", () => {
    const ids = [
      ...sampleResume.experience,
      ...sampleResume.education,
      ...sampleResume.skills,
      ...sampleResume.projects,
      ...sampleResume.certificates,
      ...sampleResume.languages,
    ].map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

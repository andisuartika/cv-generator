import { describe, expect, it } from "vitest";
import { buildReviewPayload, hasReviewableContent, redactContacts, ReviewPayloadSchema } from "@/lib/ai/payload";
import { emptyResume, sampleResume } from "@/lib/defaults";
import type { Resume } from "@/lib/schema";

const secrets = {
  name: "Kadek Wirawan",
  email: "kadek.rahasia@surat.co.id",
  phone: "0812-9999-8888",
  location: "Jalan Mawar 7, Gianyar",
  website: "https://kadek-rahasia.example",
  photo: "data:image/png;base64,UkFIQVNJQQ==",
};

const resume: Resume = {
  ...sampleResume,
  basics: {
    ...secrets,
    title: "Developer",
    summary: `Saya Kadek Wirawan. Hubungi ${secrets.email} atau +62 812 3456 7890, lihat ${secrets.website} dan linkedin.com/in/kadek.`,
  },
  experience: [
    { ...sampleResume.experience[0], location: "Alamat Kantor Rahasia", bullets: ["Wirawan memimpin tim. WA 081234567890"] },
  ],
  projects: [{ id: "p", name: "Portal KADEK", link: "https://github.com/kadek/portal", description: "Lihat www.portal.example" }],
};

describe("data untuk penilaian AI", () => {
  it("tidak memuat foto, nama, kontak, alamat, tautan, atau id", () => {
    const sent = JSON.stringify(buildReviewPayload(resume)).toLowerCase();
    for (const secret of [
      ...Object.values(secrets), "kadek", "wirawan", "3456 7890", "081234567890",
      "linkedin.com", "github.com", "www.portal", "alamat kantor", "exp-1", "base64",
    ]) {
      expect(sent, secret).not.toContain(secret.toLowerCase());
    }
    expect(sent).toContain("[nama]");
    expect(sent).toContain("[email]");
    expect(sent).toContain("[telepon]");
    expect(sent).toContain("[tautan]");
  });

  it("tidak merusak teks teknis, tahun, dan angka besar", () => {
    const text = "Next.js, Node.js, ASP.NET, 2019-2023, 2020 - 2021, 10000000 pengguna, naik 40%, Rp 1.500.000.000, ISO 27001:2022";
    expect(redactContacts(text)).toBe(text);
  });

  it("tidak mengganti nama yang hanya bagian dari kata lain", () => {
    const payload = buildReviewPayload({
      ...sampleResume,
      basics: { name: "Ani", summary: "Menangani anggaran. Ani memimpin." },
    });
    expect(payload.summary).toBe("Menangani anggaran. [nama] memimpin.");
  });

  it("hanya memuat section yang tampil, dengan nomor sesuai editor", () => {
    const blank = { id: "kosong", company: "", role: "", start: "", current: false, bullets: [] };
    const payload = buildReviewPayload({
      ...sampleResume,
      experience: [blank, sampleResume.experience[0]],
      hiddenSections: ["education", "skills"],
    });
    expect(payload.experience?.map((e) => e.number)).toEqual([2]);
    expect(payload.education).toBeUndefined();
    expect(payload.skills).toBeUndefined();
  });

  it("lolos skema server dan menandai CV tanpa isi untuk dinilai", () => {
    expect(ReviewPayloadSchema.parse(buildReviewPayload(sampleResume))).toEqual(buildReviewPayload(sampleResume));
    expect(hasReviewableContent(buildReviewPayload(emptyResume))).toBe(false);
  });
});

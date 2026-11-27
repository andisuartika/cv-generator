import { ResumeSchema, SECTION_KEYS, type Resume } from "@/lib/schema";

/** CV kosong: dipakai tombol "Kosongkan" dan sebagai nilai awal yang aman. */
export const emptyResume: Resume = {
  version: 1,
  templateId: "classic",
  theme: { accent: "#2563eb", font: "Inter", fontSize: 10.5 },
  basics: { name: "" },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certificates: [],
  languages: [],
  sectionOrder: [...SECTION_KEYS],
  hiddenSections: [],
};

/** Data contoh lengkap untuk pengguna baru dan untuk pengembangan template. */
export const sampleResume: Resume = ResumeSchema.parse({
  version: 1,
  templateId: "classic",
  theme: { accent: "#2563eb", font: "Inter", fontSize: 10.5 },
  basics: {
    name: "Putu Contoh Nama",
    title: "Software Developer",
    email: "contoh@email.com",
    phone: "+62 812 3456 7890",
    location: "Denpasar, Bali",
    website: "https://contoh.dev",
    summary:
      "Pengembang perangkat lunak dengan pengalaman membangun aplikasi web dan mobile, fokus pada kualitas kode dan pengalaman pengguna.",
  },
  experience: [
    {
      id: "exp-1",
      company: "PT Contoh Teknologi",
      role: "Software Developer",
      start: "2023-01",
      current: true,
      location: "Denpasar",
      bullets: [
        "Membangun dan merawat aplikasi web yang dipakai ribuan pengguna.",
        "Menurunkan waktu muat halaman utama sebesar 40%.",
      ],
    },
    {
      id: "exp-2",
      company: "CV Contoh Digital",
      role: "Junior Developer",
      start: "2021-06",
      end: "2022-12",
      current: false,
      bullets: ["Mengembangkan fitur baru bersama tim kecil dan menulis uji otomatis."],
    },
  ],
  education: [
    {
      id: "edu-1",
      school: "Universitas Contoh",
      degree: "S.Kom, Teknik Informatika",
      start: "2017-08",
      end: "2021-07",
    },
  ],
  skills: [
    { id: "sk-1", group: "Bahasa", items: ["TypeScript", "Dart", "PHP"] },
    { id: "sk-2", group: "Framework", items: ["Next.js", "Flutter", "Laravel"] },
  ],
  projects: [
    {
      id: "pr-1",
      name: "Aplikasi Contoh",
      link: "https://contoh.dev/app",
      description: "Aplikasi untuk mencatat dan memantau data harian.",
    },
  ],
  certificates: [{ id: "ce-1", name: "Contoh Sertifikasi Web", issuer: "Lembaga Contoh", year: "2022" }],
  languages: [
    { id: "la-1", name: "Indonesia", level: "Penutur asli" },
    { id: "la-2", name: "Inggris", level: "Profesional" },
  ],
  sectionOrder: [...SECTION_KEYS],
  hiddenSections: [],
});

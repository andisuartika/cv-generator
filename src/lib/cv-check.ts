import { ResumeFormSchema } from "@/lib/form-schema";
import { hasText } from "@/lib/format";
import type { Resume, SectionKey } from "@/lib/schema";

/**
 * Rule-based review of a resume. It runs in the browser and looks at
 * completeness, format, and common writing habits, not at content quality.
 */
export type CheckTarget = "basics" | SectionKey;

export type Finding = {
  id: string;
  severity: "important" | "suggestion";
  /** The editor panel where the problem can be fixed. */
  target: CheckTarget;
  title: string;
  detail: string;
};

export const MAX_SUMMARY_LENGTH = 600;
export const MIN_SUMMARY_LENGTH = 80;
export const MAX_BULLET_LENGTH = 220;
export const MAX_PAGES = 2;

/** Openings that describe a duty rather than what the person did. */
const WEAK_OPENINGS = ["bertanggung jawab", "tanggung jawab", "membantu", "tugas saya", "ikut serta"];
const FIRST_PERSON = /(^|[^\p{L}])(saya|aku)(?![\p{L}])/iu;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

const any = (...values: (string | undefined)[]) => values.some(hasText);

/** "1, 3" from zero-based positions. */
const numbers = (indexes: number[]) => indexes.map((i) => i + 1).join(", ");

type Context = {
  /** Estimated number of A4 pages, if known. */
  pages?: number;
};

export function checkResume(resume: Resume, { pages }: Context = {}): Finding[] {
  const findings: Finding[] = [];
  const add = (
    severity: Finding["severity"],
    target: CheckTarget,
    id: string,
    title: string,
    detail: string,
  ) => findings.push({ id, severity, target, title, detail });

  // A hidden section is not on the CV, so it is not reviewed.
  const shown = (key: SectionKey) => !resume.hiddenSections.includes(key);

  const { basics } = resume;
  if (!hasText(basics.name)) {
    add("important", "basics", "name", "Nama belum diisi", "Perekrut perlu tahu CV ini milik siapa.");
  }
  if (!any(basics.email, basics.phone)) {
    add("important", "basics", "contact", "Belum ada email atau nomor telepon", "Isi minimal salah satu agar Anda bisa dihubungi.");
  } else if (!hasText(basics.email)) {
    add("suggestion", "basics", "email", "Email belum diisi", "Banyak perekrut menghubungi pelamar lewat email.");
  }
  if (!hasText(basics.title)) {
    add("suggestion", "basics", "title", "Jabatan atau profesi belum diisi", "Tulis posisi Anda atau posisi yang dituju di bawah nama.");
  }

  // Format problems reuse the editor's rules, so both always agree.
  const format = ResumeFormSchema.safeParse(resume);
  for (const issue of format.error?.issues ?? []) {
    const [root, index, field] = issue.path.map(String);
    if (root === "basics") {
      const label = index === "email" ? "Email" : "Situs web";
      add("important", "basics", `format-${index}`, `${label} perlu diperiksa`, issue.message);
    } else if (root === "experience" || root === "education" || root === "projects") {
      if (!shown(root)) continue;
      const noun = { experience: "Pengalaman", education: "Pendidikan", projects: "Proyek" }[root];
      const label = { start: "tanggal mulai", end: "tanggal selesai", link: "tautan" }[field] ?? field;
      // The end date is ignored while the job is current.
      if (root === "experience" && field === "end" && resume.experience[Number(index)].current) continue;
      add("important", root, `format-${root}-${index}-${field}`, `${noun} ${Number(index) + 1}: ${label} perlu diperiksa`, issue.message);
    }
  }

  if (shown("summary")) {
    const summary = basics.summary?.trim() ?? "";
    if (!summary) {
      add("suggestion", "summary", "summary-empty", "Ringkasan belum diisi", "Dua sampai empat kalimat membantu perekrut mengenali Anda dengan cepat.");
    } else if (summary.length < MIN_SUMMARY_LENGTH) {
      add("suggestion", "summary", "summary-short", "Ringkasan sangat singkat", "Sebutkan bidang, pengalaman, dan keunggulan utama Anda.");
    } else if (summary.length > MAX_SUMMARY_LENGTH) {
      add("suggestion", "summary", "summary-long", "Ringkasan terlalu panjang", `Sekarang ${summary.length} karakter. Usahakan di bawah ${MAX_SUMMARY_LENGTH}.`);
    }
  }

  // Positions are kept so that numbers match the ones shown in the editor.
  const experience = resume.experience
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => any(item.role, item.company, item.start, item.end, item.location, ...item.bullets));
  const hasProjects = shown("projects") && resume.projects.some((p) => any(p.name, p.description, p.link));

  if ((!shown("experience") || experience.length === 0) && !hasProjects) {
    add("important", "experience", "no-experience", "Belum ada pengalaman atau proyek", "Jika belum pernah bekerja, isi magang, organisasi, atau proyek.");
  }

  const seenBullets = new Set<string>();
  let hasDuplicate = false;
  for (const { item, index } of shown("experience") ? experience : []) {
    const name = `Pengalaman ${index + 1}`;
    const key = `experience-${index}`;
    if (!hasText(item.role) || !hasText(item.company)) {
      add("important", "experience", `${key}-identity`, `${name}: posisi atau perusahaan kosong`, "Isi keduanya.");
    }
    if (!hasText(item.start)) {
      add("suggestion", "experience", `${key}-start`, `${name}: tanggal mulai kosong`, "Perekrut biasanya memeriksa lama bekerja.");
    }
    if (!item.current && !hasText(item.end)) {
      add("suggestion", "experience", `${key}-end`, `${name}: tanggal selesai kosong`, "Isi tanggal selesai, atau centang bahwa Anda masih bekerja di sana.");
    }
    const start = item.start.trim();
    const end = item.end?.trim() ?? "";
    if (!item.current && MONTH.test(start) && MONTH.test(end) && end < start) {
      add("important", "experience", `${key}-order`, `${name}: tanggal selesai sebelum tanggal mulai`, "Periksa kedua tanggalnya.");
    }

    // Blank lines are skipped by templates, so they are not counted.
    const bullets = item.bullets.map((b) => b.trim()).filter(Boolean);
    if (bullets.length === 0) {
      add("suggestion", "experience", `${key}-bullets`, `${name}: belum ada poin pencapaian`, "Tulis dua sampai lima hal yang Anda kerjakan atau hasilkan.");
      continue;
    }
    const long = bullets.flatMap((b, i) => (b.length > MAX_BULLET_LENGTH ? [i] : []));
    if (long.length > 0) {
      add("suggestion", "experience", `${key}-long`, `${name}: poin terlalu panjang`, `Poin ${numbers(long)} lebih dari ${MAX_BULLET_LENGTH} karakter. Pecah atau ringkas.`);
    }
    const weak = bullets.flatMap((b, i) => (WEAK_OPENINGS.some((w) => b.toLowerCase().startsWith(w)) ? [i] : []));
    if (weak.length > 0) {
      add("suggestion", "experience", `${key}-weak`, `${name}: awali poin dengan tindakan`, `Poin ${numbers(weak)} diawali uraian tugas. Mulai dengan hal yang Anda lakukan, misalnya "Membangun" atau "Menyusun".`);
    }
    const personal = bullets.flatMap((b, i) => (FIRST_PERSON.test(b) ? [i] : []));
    if (personal.length > 0) {
      add("suggestion", "experience", `${key}-person`, `${name}: hindari kata "saya"`, `Poin ${numbers(personal)} memakai kata ganti orang pertama. Poin CV lazimnya langsung diawali kata kerja.`);
    }
    if (!bullets.some((b) => /\d/.test(b))) {
      add("suggestion", "experience", `${key}-numbers`, `${name}: belum ada angka`, "Jika Anda punya datanya, tambahkan jumlah, persentase, atau lama pengerjaan. Jangan mengarang angka.");
    }
    for (const bullet of bullets) {
      const normalized = bullet.toLowerCase();
      if (seenBullets.has(normalized)) hasDuplicate = true;
      seenBullets.add(normalized);
    }
  }
  if (hasDuplicate) {
    add("suggestion", "experience", "duplicate-bullets", "Ada poin yang sama persis", "Hapus atau bedakan poin yang berulang.");
  }

  if (shown("education") && !resume.education.some((e) => any(e.school, e.degree))) {
    add("suggestion", "education", "no-education", "Pendidikan belum diisi", "Tambahkan pendidikan terakhir Anda.");
  }
  if (shown("skills") && !resume.skills.some((s) => s.items.some(hasText))) {
    add("suggestion", "skills", "no-skills", "Keahlian belum diisi", "Daftar keahlian membantu pencocokan dengan kebutuhan lowongan.");
  }

  if (pages !== undefined && pages > MAX_PAGES) {
    add("suggestion", "experience", "pages", `CV sekitar ${pages} halaman`, `Untuk sebagian besar lamaran, usahakan paling banyak ${MAX_PAGES} halaman.`);
  }

  // Important findings first; the order within each group follows the CV.
  return findings.sort((a, b) => Number(a.severity === "suggestion") - Number(b.severity === "suggestion"));
}

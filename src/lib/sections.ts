import { hasText } from "@/lib/format";
import { SECTION_KEYS, type Resume, type SectionKey } from "@/lib/schema";

/** CV section headings. */
export const SECTION_LABELS: Record<SectionKey, string> = {
  summary: "Ringkasan",
  experience: "Pengalaman",
  education: "Pendidikan",
  skills: "Keahlian",
  projects: "Proyek",
  certificates: "Sertifikat",
  languages: "Bahasa",
};

const anyText = (...values: (string | undefined)[]) => values.some(hasText);

/** Returns a copy of the data without blank items, bullets, and skills. */
export function compactResume(data: Resume): Resume {
  return {
    ...data,
    experience: data.experience
      .map((e) => ({ ...e, bullets: e.bullets.filter(hasText) }))
      .filter((e) => anyText(e.company, e.role, e.location, e.start, e.end, ...e.bullets)),
    education: data.education.filter((e) =>
      anyText(e.school, e.degree, e.start, e.end, e.description),
    ),
    skills: data.skills
      .map((s) => ({ ...s, items: s.items.filter(hasText) }))
      .filter((s) => s.items.length > 0),
    projects: data.projects.filter((p) => anyText(p.name, p.link, p.description)),
    certificates: data.certificates.filter((c) => anyText(c.name, c.issuer, c.year)),
    languages: data.languages.filter((l) => anyText(l.name, l.level)),
  };
}

function isSectionKey(key: string): key is SectionKey {
  return (SECTION_KEYS as readonly string[]).includes(key);
}

/**
 * Sections to render, following sectionOrder and skipping hidden, empty,
 * unknown, and duplicate keys. Pass data that went through compactResume.
 */
export function getVisibleSections(data: Resume): SectionKey[] {
  return [...new Set(data.sectionOrder)].filter(isSectionKey).filter((key) => {
    if (data.hiddenSections.includes(key)) return false;
    return key === "summary" ? hasText(data.basics.summary) : data[key].length > 0;
  });
}

import { nanoid } from "nanoid";
import { emptyResume } from "@/lib/defaults";
import { isSafePhoto } from "@/lib/image-utils";
import { ResumeSchema, type Resume } from "@/lib/schema";
import { isSectionKey, normalizeSectionOrder } from "@/lib/section-order";

/** JSON backup and restore of a resume. */
export const MAX_RESUME_FILE_BYTES = 5 * 1024 * 1024;

export const serializeResume = (resume: Resume) => JSON.stringify(resume, null, 2);

export type ParseResult = { ok: true; resume: Resume } | { ok: false; message: string };

/** Missing or repeated ids would break editing and reordering. */
function withUniqueIds<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.map((item) => {
    const id = item.id && !seen.has(item.id) ? item.id : nanoid();
    seen.add(id);
    return { ...item, id };
  });
}

/** For data from outside the app: unsafe or inconsistent values are replaced. */
export function sanitizeResume(resume: Resume): Resume {
  const { theme, basics } = resume;
  return {
    ...resume,
    theme: {
      ...theme,
      accent: /^#[0-9a-f]{6}$/i.test(theme.accent) ? theme.accent : emptyResume.theme.accent,
      font: emptyResume.theme.font, // only the bundled font is available
    },
    basics: { ...basics, photo: isSafePhoto(basics.photo) ? basics.photo : undefined },
    experience: withUniqueIds(resume.experience),
    education: withUniqueIds(resume.education),
    skills: withUniqueIds(resume.skills),
    projects: withUniqueIds(resume.projects),
    certificates: withUniqueIds(resume.certificates),
    languages: withUniqueIds(resume.languages),
    sectionOrder: normalizeSectionOrder(resume.sectionOrder),
    hiddenSections: [...new Set(resume.hiddenSections.filter(isSectionKey))],
  };
}

export function parseResumeFile(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, message: "File bukan JSON yang valid. CV Anda tidak diubah." };
  }
  const parsed = ResumeSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      message: "File ini bukan cadangan CV dari aplikasi ini, atau isinya rusak. CV Anda tidak diubah.",
    };
  }
  return { ok: true, resume: sanitizeResume(parsed.data) };
}

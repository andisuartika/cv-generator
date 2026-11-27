import { z } from "zod";
import { toSafeUrl } from "@/lib/format";
import {
  BasicsSchema,
  EducationItemSchema,
  ExperienceItemSchema,
  ProjectItemSchema,
  ResumeSchema,
} from "@/lib/schema";

/**
 * Format checks for the editor only. The results are shown as warnings and
 * never block saving; storage keeps using the looser ResumeSchema.
 */
const isBlank = (value: string) => value.trim() === "";

function isWebAddress(value: string): boolean {
  const url = toSafeUrl(value);
  if (!url || !URL.canParse(url)) return false;
  return new URL(url).hostname.includes(".");
}

const email = z
  .string()
  .refine((v) => isBlank(v) || z.email().safeParse(v.trim()).success, "Format email tampaknya salah.");

const webAddress = z
  .string()
  .refine((v) => isBlank(v) || isWebAddress(v), "Alamat web tampaknya salah.");

const month = z
  .string()
  .refine(
    (v) => isBlank(v) || /^\d{4}-(0[1-9]|1[0-2])$/.test(v.trim()),
    "Gunakan format TTTT-BB, misalnya 2024-03.",
  );

export const ResumeFormSchema = ResumeSchema.extend({
  basics: BasicsSchema.extend({ email: email.optional(), website: webAddress.optional() }),
  experience: z.array(ExperienceItemSchema.extend({ start: month, end: month.optional() })),
  education: z.array(EducationItemSchema.extend({ start: month, end: month.optional() })),
  projects: z.array(ProjectItemSchema.extend({ link: webAddress.optional() })),
});

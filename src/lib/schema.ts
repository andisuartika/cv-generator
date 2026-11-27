import { z } from "zod";

export const SECTION_KEYS = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certificates",
  "languages",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const ThemeSchema = z.object({
  accent: z.string().default("#2563eb"),
  font: z.string().default("Inter"),
  fontSize: z.number().min(9).max(12).default(10.5),
});

export const BasicsSchema = z.object({
  name: z.string(),
  title: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  photo: z.string().optional(), // data URL hasil crop dan kompres
  summary: z.string().optional(),
});

export const ExperienceItemSchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  start: z.string(), // YYYY-MM
  end: z.string().optional(), // YYYY-MM
  current: z.boolean().default(false),
  location: z.string().optional(),
  bullets: z.array(z.string()),
});

export const EducationItemSchema = z.object({
  id: z.string(),
  school: z.string(),
  degree: z.string(),
  start: z.string(),
  end: z.string().optional(),
  description: z.string().optional(),
});

export const SkillGroupSchema = z.object({
  id: z.string(),
  group: z.string(),
  items: z.array(z.string()),
});

export const ProjectItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  link: z.string().optional(),
  description: z.string().optional(),
});

export const CertificateItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string().optional(),
  year: z.string().optional(),
});

export const LanguageItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.string().optional(),
});

export const ResumeSchema = z.object({
  version: z.literal(1), // untuk migrasi data di masa depan
  templateId: z.string(),
  theme: ThemeSchema,
  basics: BasicsSchema,
  experience: z.array(ExperienceItemSchema),
  education: z.array(EducationItemSchema),
  skills: z.array(SkillGroupSchema),
  projects: z.array(ProjectItemSchema),
  certificates: z.array(CertificateItemSchema),
  languages: z.array(LanguageItemSchema),
  sectionOrder: z.array(z.string()), // urutan tampil
  hiddenSections: z.array(z.string()).default([]),
});

export type Resume = z.infer<typeof ResumeSchema>;

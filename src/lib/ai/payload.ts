import { z } from "zod";
import { hasText } from "@/lib/format";
import type { Resume } from "@/lib/schema";
import { compactResume, getVisibleSections } from "@/lib/sections";

/**
 * What is sent for an AI review. It is an allow list: the photo, name, contact
 * details, location, website, project links, and ids are never part of it.
 * The browser builds it, so the user can see exactly what leaves the device.
 */
export const MAX_REVIEW_REQUEST_BYTES = 60 * 1024;

const short = z.string().max(300);
const long = z.string().max(3000);

export const ReviewPayloadSchema = z.object({
  title: short.optional(),
  summary: long.optional(),
  experience: z
    .array(
      z.object({
        number: z.number().int(),
        role: short,
        company: short,
        start: short,
        end: short,
        bullets: z.array(z.string().max(1000)).max(30),
      }),
    )
    .max(30)
    .optional(),
  education: z
    .array(z.object({ school: short, degree: short, start: short, end: short, description: long }))
    .max(15)
    .optional(),
  skills: z.array(z.object({ group: short, items: z.array(short).max(60) })).max(20).optional(),
  projects: z.array(z.object({ name: short, description: long })).max(30).optional(),
  certificates: z.array(z.object({ name: short, issuer: short, year: short })).max(40).optional(),
  languages: z.array(z.object({ name: short, level: short })).max(20).optional(),
});

export type ReviewPayload = z.infer<typeof ReviewPayloadSchema>;

const EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.\p{L}{2,}/gu;
// http and www links, plus bare domains followed by a path (profile pages).
const LINK = /\b(?:https?:\/\/|www\.)\S+|\b[\w-]+(?:\.[\w-]+)*\.(?:com|id|net|org|io|dev|me)\/\S*/gi;
// Indonesian and international numbers. They must start with +, 0, or 62, so
// that year ranges and large counts are left alone.
const PHONE = /(?<![\w.,])(?:\+\d|0|62)(?:[\s().-]{0,2}\d){7,14}(?!\w)/g;

/** Best-effort removal of contact details typed inside free text. */
export function redactContacts(text: string): string {
  return text.replace(EMAIL, "[email]").replace(LINK, "[tautan]").replace(PHONE, "[telepon]");
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Replaces the owner's name, website, and address wherever they appear. */
function redactOwner(basics: Resume["basics"]) {
  const name = basics.name.trim();
  const parts = [name, ...name.split(/\s+/)].filter((part) => part.length >= 3);
  const rules: [string | undefined, string][] = [
    ...parts.map((part): [string, string] => [part, "[nama]"]),
    [basics.website, "[tautan]"],
    [basics.email, "[email]"],
    [basics.phone, "[telepon]"],
  ];
  const patterns = rules
    .filter((rule): rule is [string, string] => hasText(rule[0]))
    // Whole words only, so that a short name does not damage longer words.
    .map(([value, label]) => ({
      pattern: new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(value.trim())}(?![\\p{L}\\p{N}])`, "giu"),
      label,
    }));
  return (text: string) =>
    patterns.reduce((result, { pattern, label }) => result.replace(pattern, label), redactContacts(text));
}

/** Applies a text transform to every string in a payload. */
export function mapStrings<T>(value: T, transform: (text: string) => string): T {
  if (typeof value === "string") return transform(value) as T;
  if (Array.isArray(value)) return value.map((item) => mapStrings(item, transform)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, mapStrings(item, transform)]),
    ) as T;
  }
  return value;
}

/** Only sections that appear on the CV are included. */
export function buildReviewPayload(resume: Resume): ReviewPayload {
  // Positions are recorded before blank items are removed, to match the editor.
  const numbers = new Map(resume.experience.map((item, index) => [item.id, index + 1]));
  const data = compactResume(resume);
  const visible = new Set(getVisibleSections(data));
  const text = (value: string | undefined) => value?.trim() ?? "";

  const payload: ReviewPayload = {
    title: text(data.basics.title) || undefined,
    summary: visible.has("summary") ? text(data.basics.summary) : undefined,
    experience: visible.has("experience")
      ? data.experience.map((e) => ({
          number: numbers.get(e.id) ?? 0,
          role: text(e.role),
          company: text(e.company),
          start: text(e.start),
          end: e.current ? "sekarang" : text(e.end),
          bullets: e.bullets.map((b) => b.trim()),
        }))
      : undefined,
    education: visible.has("education")
      ? data.education.map((e) => ({
          school: text(e.school),
          degree: text(e.degree),
          start: text(e.start),
          end: text(e.end),
          description: text(e.description),
        }))
      : undefined,
    skills: visible.has("skills")
      ? data.skills.map((s) => ({ group: text(s.group), items: s.items.map((i) => i.trim()) }))
      : undefined,
    projects: visible.has("projects")
      ? data.projects.map((p) => ({ name: text(p.name), description: text(p.description) }))
      : undefined,
    certificates: visible.has("certificates")
      ? data.certificates.map((c) => ({ name: text(c.name), issuer: text(c.issuer), year: text(c.year) }))
      : undefined,
    languages: visible.has("languages")
      ? data.languages.map((l) => ({ name: text(l.name), level: text(l.level) }))
      : undefined,
  };
  // JSON round trip drops the undefined sections.
  return JSON.parse(JSON.stringify(mapStrings(payload, redactOwner(resume.basics)))) as ReviewPayload;
}

export function hasReviewableContent(payload: ReviewPayload): boolean {
  return Boolean(payload.summary || payload.experience?.length || payload.projects?.length);
}

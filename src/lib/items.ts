import { nanoid } from "nanoid";
import type { Resume } from "@/lib/schema";

/** Factories for blank list items. */
export const newExperience = (): Resume["experience"][number] => ({
  id: nanoid(), company: "", role: "", start: "", end: "", current: false, location: "", bullets: [],
});

export const newEducation = (): Resume["education"][number] => ({
  id: nanoid(), school: "", degree: "", start: "", end: "", description: "",
});

export const newSkillGroup = (): Resume["skills"][number] => ({ id: nanoid(), group: "", items: [] });

export const newProject = (): Resume["projects"][number] => ({
  id: nanoid(), name: "", link: "", description: "",
});

export const newCertificate = (): Resume["certificates"][number] => ({
  id: nanoid(), name: "", issuer: "", year: "",
});

export const newLanguage = (): Resume["languages"][number] => ({ id: nanoid(), name: "", level: "" });

/** "a, b,, c" -> ["a", "b", "c"] */
export const parseList = (text: string): string[] =>
  text.split(",").map((part) => part.trim()).filter(Boolean);

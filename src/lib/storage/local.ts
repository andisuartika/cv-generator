import { ResumeSchema, type Resume } from "@/lib/schema";
import type { ResumeStorage } from "@/lib/storage/adapter";

const KEY = "cv-generator:resume:v1";

export class LocalStorageAdapter implements ResumeStorage {
  async load(): Promise<Resume | null> {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = ResumeSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : null; // data rusak diabaikan
    } catch {
      return null;
    }
  }

  async save(data: Resume): Promise<void> {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  }

  async clear(): Promise<void> {
    window.localStorage.removeItem(KEY);
  }
}

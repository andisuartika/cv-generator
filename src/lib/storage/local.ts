import { ResumeSchema, type Resume } from "@/lib/schema";
import { CorruptDataError, type ResumeStorage } from "@/lib/storage/adapter";

export const STORAGE_KEY = "cv-generator:resume:v1";
export const BACKUP_KEY_PREFIX = `${STORAGE_KEY}:backup:`;

function parseResume(raw: string): Resume | null {
  try {
    const parsed = ResumeSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export class LocalStorageAdapter implements ResumeStorage {
  constructor(private readonly getStorage: () => Storage = () => window.localStorage) {}

  async load(): Promise<Resume | null> {
    const raw = this.getStorage().getItem(STORAGE_KEY);
    if (raw === null) return null;
    const resume = parseResume(raw);
    if (resume) return resume;
    throw new CorruptDataError(this.backup(raw));
  }

  async save(data: Resume): Promise<void> {
    this.getStorage().setItem(STORAGE_KEY, JSON.stringify(data));
  }

  async clear(): Promise<void> {
    this.getStorage().removeItem(STORAGE_KEY);
  }

  private backup(raw: string): boolean {
    try {
      this.getStorage().setItem(`${BACKUP_KEY_PREFIX}${Date.now()}`, raw);
      return true;
    } catch {
      return false;
    }
  }
}

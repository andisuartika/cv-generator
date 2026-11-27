import type { Resume } from "@/lib/schema";

/**
 * All CV persistence goes through this interface.
 * MVP: LocalStorageAdapter. Stage 2: ApiAdapter (signed in).
 * Components must not touch localStorage directly.
 */
export interface ResumeStorage {
  /** Returns null when nothing is stored. Throws when data cannot be read. */
  load(): Promise<Resume | null>;
  save(data: Resume): Promise<void>;
  clear(): Promise<void>;
}

/** Stored data exists but is not a valid resume. */
export class CorruptDataError extends Error {
  /** True when the raw data was copied elsewhere, so overwriting is safe. */
  readonly backedUp: boolean;

  constructor(backedUp: boolean) {
    super("Stored resume data is invalid");
    this.name = "CorruptDataError";
    this.backedUp = backedUp;
  }
}

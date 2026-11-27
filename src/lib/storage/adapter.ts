import type { Resume } from "@/lib/schema";

/**
 * Semua penyimpanan CV lewat interface ini.
 * MVP: LocalStorageAdapter. Tahap 2: ApiAdapter (login).
 * Komponen tidak boleh memanggil localStorage langsung.
 */
export interface ResumeStorage {
  load(): Promise<Resume | null>;
  save(data: Resume): Promise<void>;
  clear(): Promise<void>;
}

import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import { sampleResume } from "@/lib/defaults";
import type { Resume, SectionKey } from "@/lib/schema";
import { CorruptDataError, type ResumeStorage } from "@/lib/storage/adapter";
import { LocalStorageAdapter } from "@/lib/storage/local";

/** Fields edited by the form. Template, theme, and section settings are not. */
export type ResumeContent = Pick<
  Resume,
  "basics" | "experience" | "education" | "skills" | "projects" | "certificates" | "languages"
>;

export type LoadIssue =
  | "corrupt-backed-up" // old data was copied aside; saving continues
  | "corrupt-locked" // no backup; saving is disabled to keep the old data
  | "unavailable"; // storage cannot be read; saving is disabled

type ResumeState = {
  resume: Resume;
  /** Changes whenever the whole resume is replaced, so forms can remount. */
  revision: number;
  updateContent: (content: ResumeContent) => void;
  replaceResume: (resume: Resume) => void;
  /** Changes the layout only; the content stays as it is. */
  selectTemplate: (templateId: string) => void;
  setAccent: (accent: string) => void;
  setSectionOrder: (sectionOrder: string[]) => void;
  setSectionHidden: (section: SectionKey, hidden: boolean) => void;
};

// Kept outside the persisted store: updating it must not trigger another save.
type StorageStatus = {
  ready: boolean;
  loadIssue: LoadIssue | null;
  saveFailed: boolean;
};

export function createResumeStore(adapter: ResumeStorage) {
  const useStatus = create<StorageStatus>(() => ({
    ready: false,
    loadIssue: null,
    saveFailed: false,
  }));

  // Stays false until loading succeeds, so stored data is never overwritten early.
  let canSave = false;

  const storage: PersistStorage<Pick<ResumeState, "resume">> = {
    async getItem() {
      try {
        const resume = await adapter.load();
        canSave = true;
        return resume ? { state: { resume }, version: 0 } : null;
      } catch (error) {
        const backedUp = error instanceof CorruptDataError && error.backedUp;
        canSave = backedUp;
        let loadIssue: LoadIssue = "unavailable";
        if (error instanceof CorruptDataError) {
          loadIssue = backedUp ? "corrupt-backed-up" : "corrupt-locked";
        }
        useStatus.setState({ loadIssue });
        return null;
      }
    },
    async setItem(_name, value) {
      if (!canSave) return;
      try {
        await adapter.save(value.state.resume);
        if (useStatus.getState().saveFailed) useStatus.setState({ saveFailed: false });
      } catch {
        useStatus.setState({ saveFailed: true });
      }
    },
    async removeItem() {
      await adapter.clear();
    },
  };

  const useResume = create<ResumeState>()(
    persist(
      (set) => ({
        resume: sampleResume,
        revision: 0,
        updateContent: (content) => set((s) => ({ resume: { ...s.resume, ...content } })),
        replaceResume: (resume) => set((s) => ({ resume, revision: s.revision + 1 })),
        selectTemplate: (templateId) => set((s) => ({ resume: { ...s.resume, templateId } })),
        setAccent: (accent) =>
          set((s) => ({ resume: { ...s.resume, theme: { ...s.resume.theme, accent } } })),
        setSectionOrder: (sectionOrder) => set((s) => ({ resume: { ...s.resume, sectionOrder } })),
        setSectionHidden: (section, hidden) =>
          set((s) => {
            const others = s.resume.hiddenSections.filter((key) => key !== section);
            const hiddenSections = hidden ? [...others, section] : others;
            return { resume: { ...s.resume, hiddenSections } };
          }),
      }),
      {
        name: "resume", // unused: the adapter owns the storage key
        storage,
        partialize: (state) => ({ resume: state.resume }),
        skipHydration: true, // localStorage does not exist during server rendering
      },
    ),
  );

  let loading: Promise<void> | undefined;

  /** Loads stored data once. Safe to call repeatedly. */
  function load(): Promise<void> {
    loading ??= Promise.resolve(useResume.persist.rehydrate()).then(() => {
      useStatus.setState({ ready: true });
    });
    return loading;
  }

  return { useResume, useStatus, load };
}

export const resumeStore = createResumeStore(new LocalStorageAdapter());

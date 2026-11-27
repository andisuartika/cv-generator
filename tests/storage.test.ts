import { describe, expect, it } from "vitest";
import { emptyResume, sampleResume } from "@/lib/defaults";
import { CorruptDataError } from "@/lib/storage/adapter";
import { BACKUP_KEY_PREFIX, LocalStorageAdapter, STORAGE_KEY } from "@/lib/storage/local";
import { createResumeStore } from "@/store/resume-store";

class FakeStorage implements Storage {
  readonly data = new Map<string, string>();
  full = false;
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.full) throw new Error("QuotaExceededError");
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

function setup(storage = new FakeStorage()) {
  const adapter = new LocalStorageAdapter(() => storage);
  return { storage, adapter, store: createResumeStore(adapter) };
}

const stored = (storage: FakeStorage) => JSON.parse(storage.getItem(STORAGE_KEY) ?? "null");
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function rename(store: ReturnType<typeof createResumeStore>, name: string) {
  const { resume, updateContent } = store.useResume.getState();
  updateContent({ ...resume, basics: { ...resume.basics, name } });
}

describe("LocalStorageAdapter", () => {
  it("mengembalikan null saat belum ada data", async () => {
    expect(await setup().adapter.load()).toBeNull();
  });

  it("mencadangkan data rusak lalu melempar error", async () => {
    const { storage, adapter } = setup();
    storage.setItem(STORAGE_KEY, "{rusak");
    await expect(adapter.load()).rejects.toBeInstanceOf(CorruptDataError);
    const backup = [...storage.data].find(([key]) => key.startsWith(BACKUP_KEY_PREFIX));
    expect(backup?.[1]).toBe("{rusak");
  });
});

describe("resume store", () => {
  it("memakai data contoh untuk pengguna baru", async () => {
    const { store } = setup();
    await store.load();
    expect(store.useResume.getState().resume).toEqual(sampleResume);
    expect(store.useStatus.getState()).toMatchObject({ ready: true, loadIssue: null });
  });

  it("menyimpan perubahan dan memuatnya kembali", async () => {
    const first = setup();
    await first.store.load();
    rename(first.store, "Nama Baru");
    await tick();
    const second = setup(first.storage);
    await second.store.load();
    expect(second.store.useResume.getState().resume.basics.name).toBe("Nama Baru");
  });

  it("mengganti template tanpa mengubah isi CV", async () => {
    const { storage, store } = setup();
    await store.load();
    const before = store.useResume.getState();
    before.selectTemplate("lain");
    await tick();
    expect(store.useResume.getState().resume).toEqual({ ...before.resume, templateId: "lain" });
    expect(store.useResume.getState().revision).toBe(before.revision);
    expect(stored(storage).templateId).toBe("lain");
  });

  it("menyimpan warna aksen dan susunan section tanpa mengubah isi", async () => {
    const { storage, store } = setup();
    await store.load();
    const { resume, setAccent, setSectionOrder, setSectionHidden } = store.useResume.getState();
    setAccent("#047857");
    setSectionOrder(["skills", "summary"]);
    setSectionHidden("summary", true);
    setSectionHidden("summary", true);
    await tick();
    expect(stored(storage)).toMatchObject({
      sectionOrder: ["skills", "summary"],
      hiddenSections: ["summary"],
      theme: { ...resume.theme, accent: "#047857" },
    });
    expect(stored(storage).basics).toEqual(resume.basics);
    setSectionHidden("summary", false);
    expect(store.useResume.getState().resume.hiddenSections).toEqual([]);
  });

  it("tidak menimpa data tersimpan sebelum selesai dimuat", async () => {
    const { storage, store } = setup();
    storage.setItem(STORAGE_KEY, JSON.stringify(emptyResume));
    rename(store, "Terlalu Cepat");
    await tick();
    expect(stored(storage).basics.name).toBe("");
  });

  it("tetap menyimpan setelah data rusak berhasil dicadangkan", async () => {
    const { storage, store } = setup();
    storage.setItem(STORAGE_KEY, "{rusak");
    await store.load();
    expect(store.useStatus.getState().loadIssue).toBe("corrupt-backed-up");
    rename(store, "Mulai Lagi");
    await tick();
    expect(stored(storage).basics.name).toBe("Mulai Lagi");
  });

  it("tidak menimpa data rusak yang gagal dicadangkan", async () => {
    const { storage, store } = setup();
    storage.setItem(STORAGE_KEY, "{rusak");
    storage.full = true;
    await store.load();
    storage.full = false;
    rename(store, "Jangan Disimpan");
    await tick();
    expect(store.useStatus.getState().loadIssue).toBe("corrupt-locked");
    expect(storage.getItem(STORAGE_KEY)).toBe("{rusak");
  });

  it("menandai kegagalan simpan dan menghapus tandanya saat berhasil lagi", async () => {
    const { storage, store } = setup();
    await store.load();
    storage.full = true;
    rename(store, "A");
    await tick();
    expect(store.useStatus.getState().saveFailed).toBe(true);
    storage.full = false;
    rename(store, "B");
    await tick();
    expect(store.useStatus.getState().saveFailed).toBe(false);
    expect(stored(storage).basics.name).toBe("B");
  });

  it("menandai penyimpanan yang tidak bisa diakses", async () => {
    const store = createResumeStore(
      new LocalStorageAdapter(() => {
        throw new Error("SecurityError");
      }),
    );
    await store.load();
    expect(store.useStatus.getState()).toMatchObject({ ready: true, loadIssue: "unavailable" });
  });
});

import { describe, expect, it } from "vitest";
import { getExportFileName } from "@/lib/export/filename";

const date = new Date(2026, 0, 5);

describe("getExportFileName", () => {
  it("memakai format CV-Nama-tanggal", () => {
    expect(getExportFileName("Putu Contoh Nama", date)).toBe("CV-Putu-Contoh-Nama-2026-01-05");
  });

  it("membuang karakter yang tidak aman dan mempertahankan huruf non-Latin", () => {
    expect(getExportFileName("../a/b\\c:*?\"<>|", date)).toBe("CV-a-b-c-2026-01-05");
    expect(getExportFileName("José Ñandú 山田", date)).toBe("CV-José-Ñandú-山田-2026-01-05");
  });

  it("tetap rapi saat nama kosong atau terlalu panjang", () => {
    expect(getExportFileName("  ", date)).toBe("CV-2026-01-05");
    expect(getExportFileName("a".repeat(200), date)).toHaveLength("CV--2026-01-05".length + 60);
  });
});

import { describe, expect, it } from "vitest";
import { formatDateRange, formatMonth, toSafeUrl } from "@/lib/format";

describe("format", () => {
  it("memformat YYYY-MM dan membiarkan format lain", () => {
    expect(formatMonth("2023-08")).toBe("Agu 2023");
    expect(formatMonth("2023-13")).toBe("2023-13");
    expect(formatMonth(undefined)).toBe("");
  });

  it("menyusun rentang tanggal tanpa pemisah menggantung", () => {
    expect(formatDateRange("2023-01", "2024-01", true)).toBe("Jan 2023 – Sekarang");
    expect(formatDateRange("2023-01")).toBe("Jan 2023");
    expect(formatDateRange("", "2024-01")).toBe("Jan 2024");
    expect(formatDateRange("")).toBe("");
  });

  it("hanya membuat tautan http(s)", () => {
    expect(toSafeUrl("contoh.dev")).toBe("https://contoh.dev");
    expect(toSafeUrl("localhost:3000")).toBe("https://localhost:3000");
    expect(toSafeUrl("http://contoh.dev")).toBe("http://contoh.dev");
    expect(toSafeUrl("javascript:alert(1)")).toBeUndefined();
    expect(toSafeUrl("data:text/html,x")).toBeUndefined();
  });
});

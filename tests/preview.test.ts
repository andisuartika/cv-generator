import { describe, expect, it } from "vitest";
import { A4_HEIGHT, A4_WIDTH, getFitScale, getPageCount, stepZoom } from "@/lib/preview";

describe("preview", () => {
  it("mengecilkan lembar agar pas tanpa pernah memperbesar", () => {
    expect(getFitScale(A4_WIDTH / 2)).toBe(0.5);
    expect(getFitScale(2000)).toBe(1);
  });

  it("melompat ke langkah zoom terdekat dan berhenti di batas", () => {
    expect(stepZoom(0.63, 1)).toBe(0.75);
    expect(stepZoom(0.63, -1)).toBe(0.5);
    expect(stepZoom(1.5, 1)).toBe(1.5);
    expect(stepZoom(0.42, -1)).toBe(0.42);
  });

  it("menghitung jumlah halaman", () => {
    expect(getPageCount(A4_HEIGHT)).toBe(1);
    expect(getPageCount(A4_HEIGHT + 1)).toBe(1);
    expect(getPageCount(A4_HEIGHT + 2)).toBe(2);
    expect(getPageCount(A4_HEIGHT * 3)).toBe(3);
  });
});

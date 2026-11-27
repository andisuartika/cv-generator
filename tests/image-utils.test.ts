import { describe, expect, it } from "vitest";
import { DEFAULT_CROP, dragCrop, getCropRect, isSafePhoto, MAX_ZOOM } from "@/lib/image-utils";

describe("foto", () => {
  it("memotong persegi di tengah secara bawaan", () => {
    expect(getCropRect(800, 400, DEFAULT_CROP)).toEqual({ x: 200, y: 0, size: 400 });
    expect(getCropRect(400, 1000, DEFAULT_CROP)).toEqual({ x: 0, y: 300, size: 400 });
  });

  it("membatasi zoom dan posisi agar tetap di dalam gambar", () => {
    expect(getCropRect(800, 400, { zoom: 99, x: 5, y: -1 })).toEqual({
      x: 800 - 400 / MAX_ZOOM, y: 0, size: 400 / MAX_ZOOM,
    });
  });

  it("menggeser berlawanan dengan arah tarikan dan berhenti di tepi", () => {
    const image = { width: 800, height: 400 };
    expect(dragCrop(DEFAULT_CROP, image, { x: 100, y: 100 }, 200)).toEqual({ zoom: 1, x: 0, y: 0.5 });
    expect(dragCrop(DEFAULT_CROP, image, { x: -50, y: 0 }, 200).x).toBe(0.75);
  });

  it("hanya menerima gambar raster yang tertanam", () => {
    expect(isSafePhoto("data:image/jpeg;base64,AAAA")).toBe(true);
    for (const value of [undefined, "", "https://a.example/x.png", "data:image/svg+xml;base64,AAAA", "data:image/png;base64,AA\"onerror"]) {
      expect(isSafePhoto(value)).toBe(false);
    }
  });
});

/** Photo handling. Everything runs in the browser; photos are never uploaded. */
export const PHOTO_SIZE = 400;
export const MAX_PHOTO_FILE_BYTES = 10 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Target length of the stored data URL, to keep browser storage small. */
const MAX_PHOTO_URL_LENGTH = 150_000;

/**
 * Only embedded raster images are rendered. A web address in imported data
 * would make the browser contact another server.
 */
export function isSafePhoto(value: string | undefined): value is string {
  return value !== undefined && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value);
}

export type Crop = {
  /** 1 shows as much of the image as a square allows. */
  zoom: number;
  /** Position from 0 (left or top) to 1 (right or bottom). */
  x: number;
  y: number;
};

export const MAX_ZOOM = 4;
export const DEFAULT_CROP: Crop = { zoom: 1, x: 0.5, y: 0.5 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** The square area of the source image selected by a crop. */
export function getCropRect(width: number, height: number, crop: Crop) {
  const size = Math.min(width, height) / clamp(crop.zoom, 1, MAX_ZOOM);
  return {
    x: (width - size) * clamp(crop.x, 0, 1),
    y: (height - size) * clamp(crop.y, 0, 1),
    size,
  };
}

/** Moves the crop after dragging the preview by a number of preview pixels. */
export function dragCrop(
  crop: Crop,
  image: { width: number; height: number },
  delta: { x: number; y: number },
  previewSize: number,
): Crop {
  const { size } = getCropRect(image.width, image.height, crop);
  const move = (position: number, pixels: number, length: number) => {
    const room = length - size;
    return room <= 0 ? position : clamp(position - (pixels * size) / previewSize / room, 0, 1);
  };
  return { ...crop, x: move(crop.x, delta.x, image.width), y: move(crop.y, delta.y, image.height) };
}

export function drawCrop(canvas: HTMLCanvasElement, image: ImageBitmap, crop: Crop) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const { x, y, size } = getCropRect(image.width, image.height, crop);
  // JPEG has no transparency, so transparent pixels become white.
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingQuality = "high";
  context.drawImage(image, x, y, size, size, 0, 0, canvas.width, canvas.height);
}

/** Reads a chosen file. Throws an Error with a message for the user. */
export async function readPhotoFile(file: File): Promise<ImageBitmap> {
  if (!PHOTO_TYPES.includes(file.type)) throw new Error("Pilih foto berformat JPG, PNG, atau WebP.");
  if (file.size > MAX_PHOTO_FILE_BYTES) throw new Error("Ukuran foto maksimal 10 MB.");
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Foto tidak bisa dibaca. Coba file lain.");
  }
}

/** Returns the cropped photo as a small JPEG data URL. */
export function encodePhoto(image: ImageBitmap, crop: Crop): string {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = PHOTO_SIZE;
  drawCrop(canvas, image, crop);
  let result = "";
  for (const quality of [0.85, 0.75, 0.65, 0.5]) {
    result = canvas.toDataURL("image/jpeg", quality);
    if (result.length <= MAX_PHOTO_URL_LENGTH) break;
  }
  return result;
}

/** A4 at 96 dpi; must match .a4-canvas in print.css. */
export const A4_WIDTH = 794;
export const A4_HEIGHT = 1123;

export const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5];

/** Scale that fits the sheet into the available width, never enlarging it. */
export function getFitScale(availableWidth: number): number {
  return Math.min(1, availableWidth / A4_WIDTH);
}

/** The next fixed zoom step above or below the current scale. */
export function stepZoom(scale: number, direction: 1 | -1): number {
  const next =
    direction === 1
      ? ZOOM_STEPS.find((step) => step > scale + 0.001)
      : ZOOM_STEPS.findLast((step) => step < scale - 0.001);
  return next ?? scale;
}

export function getPageCount(contentHeight: number): number {
  // One pixel of tolerance absorbs rounding in measured heights.
  return Math.max(1, Math.ceil((contentHeight - 1) / A4_HEIGHT));
}

/** "CV-<Name>-<YYYY-MM-DD>", stripped of characters that are unsafe in file names. */
export function getExportFileName(name: string, date = new Date()): string {
  const safeName = name
    .normalize("NFC")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  const day = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, "0"))
    .join("-");
  return ["CV", safeName, day].filter(Boolean).join("-");
}

/**
 * Opens the browser print dialog, where the user can save as PDF.
 * Browsers use the document title as the suggested file name.
 */
export async function printResume(fileName: string) {
  await document.fonts.ready;
  const title = document.title;
  window.addEventListener("afterprint", () => (document.title = title), { once: true });
  document.title = fileName;
  window.print();
}

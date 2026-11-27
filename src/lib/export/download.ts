/** Saves a data or object URL as a file. */
export function downloadUrl(url: string, fileName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
}

export function downloadText(text: string, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  downloadUrl(url, fileName);
  // Revoked later because some browsers start the download asynchronously.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

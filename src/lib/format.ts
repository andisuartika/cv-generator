const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function hasText(value: string | undefined): value is string {
  return value !== undefined && value.trim() !== "";
}

/** "2023-01" -> "Jan 2023". Unrecognized input is returned unchanged. */
export function formatMonth(value: string | undefined): string {
  if (!hasText(value)) return "";
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value.trim());
  return match ? `${MONTHS[Number(match[2]) - 1]} ${match[1]}` : value.trim();
}

export function formatDateRange(start: string, end?: string, current = false): string {
  const to = current ? "Sekarang" : formatMonth(end);
  return [formatMonth(start), to].filter(Boolean).join(" – ");
}

/**
 * Turns user input into a safe link target. Only http(s) is allowed, so
 * imported data cannot inject schemes such as "javascript:".
 */
export function toSafeUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed === "" || /\s/.test(trimmed)) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // A colon followed by a non-digit is a scheme; "host:8080" is a port.
  if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(trimmed)) return undefined;
  return `https://${trimmed}`;
}

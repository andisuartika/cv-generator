import type { CSSProperties } from "react";
import { hasText } from "@/lib/format";
import type { Resume } from "@/lib/schema";

/** Root style that applies the user's theme; CSS modules read var(--accent). */
export function themeStyle(theme: Resume["theme"]): CSSProperties {
  return {
    "--accent": theme.accent,
    fontFamily: `"${theme.font}", Arial, sans-serif`,
    fontSize: `${theme.fontSize}pt`,
  } as CSSProperties;
}

export function getContacts(basics: Resume["basics"]): string[] {
  return [basics.email, basics.phone, basics.location].filter(hasText);
}

/** True when there is any header text. The photo is checked per template. */
export function hasHeaderContent(basics: Resume["basics"]): boolean {
  return (
    hasText(basics.name) ||
    hasText(basics.title) ||
    hasText(basics.website) ||
    getContacts(basics).length > 0
  );
}

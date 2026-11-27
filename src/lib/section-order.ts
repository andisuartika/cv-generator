import { SECTION_KEYS, type SectionKey } from "@/lib/schema";

export function isSectionKey(key: string): key is SectionKey {
  return (SECTION_KEYS as readonly string[]).includes(key);
}

/** Every section exactly once: known keys in the given order, then the rest. */
export function normalizeSectionOrder(order: string[]): SectionKey[] {
  return [...new Set([...order.filter(isSectionKey), ...SECTION_KEYS])];
}

/** In-memory limits. They cover a single server process, which suits self-hosting. */

export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, number[]>();
  /** Records a request. Returns 0 if allowed, else the seconds to wait. */
  return function take(key: string): number {
    const time = now();
    // Drop expired entries so that the map cannot grow without bound.
    for (const [other, times] of hits) {
      if (times[times.length - 1] <= time - windowMs) hits.delete(other);
    }
    const recent = (hits.get(key) ?? []).filter((t) => t > time - windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return Math.ceil((recent[0] + windowMs - time) / 1000);
    }
    hits.set(key, [...recent, time]);
    return 0;
  };
}

/** Caps concurrent work. Returns a release function, or null when full. */
export function createSlots(max: number) {
  let used = 0;
  return function acquire(): (() => void) | null {
    if (used >= max) return null;
    used++;
    let released = false;
    return () => {
      if (!released) used--;
      released = true;
    };
  };
}

// Tiny per-session in-memory cache so client-side navigation feels instant.
// It survives route changes (the module stays loaded for the whole SPA session)
// but not a full page reload. The pattern everywhere: read the cached value and
// render it immediately, then revalidate in the background and overwrite. No
// fake data is ever stored, only the last real response from App Store Connect.

const store = new Map<string, unknown>();

export function getCache<T>(key: string): T | undefined {
  return store.get(key) as T | undefined;
}

export function setCache<T>(key: string, value: T): void {
  store.set(key, value);
}

export function clearCache(prefix?: string): void {
  if (!prefix) { store.clear(); return; }
  for (const k of Array.from(store.keys())) if (k.startsWith(prefix)) store.delete(k);
}

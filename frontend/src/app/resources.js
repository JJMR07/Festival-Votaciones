// Scoped to one AppProvider; authentication responses never enter this cache.
export function createResourceCache({ ttl = 30000, maxEntries = 100 } = {}) {
  const entries = new Map();
  const keyFor = path => {
    const [pathname, query = ''] = path.split('?');
    const params = new URLSearchParams(query);
    params.sort();
    return `${pathname}?${params}`;
  };
  return {
    clear: () => entries.clear(),
    invalidate: path => entries.delete(keyFor(path)),
    load(path, fetcher) {
      if (path.startsWith('auth/')) return fetcher(path);
      const key = keyFor(path);
      const previous = entries.get(key);
      if (previous && (previous.pending || Date.now() - previous.time < ttl)) return previous.promise;
      const entry = { pending: true, time: Date.now() };
      entry.promise = Promise.resolve().then(() => fetcher(path)).then(data => {
        entry.pending = false;
        entry.time = Date.now();
        return data;
      }).catch(error => {
        if (entries.get(key) === entry) entries.delete(key);
        throw error;
      });
      if (entries.size >= maxEntries) entries.delete(entries.keys().next().value);
      entries.set(key, entry);
      return entry.promise;
    },
  };
}

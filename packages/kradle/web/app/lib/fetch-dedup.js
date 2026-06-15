const inflight = new Map();

export function dedupFetch(url, options) {
  const key = url;
  if (inflight.has(key)) return inflight.get(key);
  const promise = fetch(url, options).finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

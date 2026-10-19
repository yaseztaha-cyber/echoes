/**
 * Phase 4 — texture residency manager. Framework-free: the loader is injected,
 * so the policy (dedup, priority, LRU eviction, refcounts) is unit-testable
 * without a GPU or DOM. The app binds it to THREE.TextureLoader elsewhere.
 */

export type LoadFn<T> = (url: string) => Promise<{ texture: T; bytes: number }>;
export type DisposeFn<T> = (texture: T) => void;

interface Entry<T> {
  url: string;
  status: "pending" | "ready" | "failed";
  texture: T | null;
  bytes: number;
  refs: number;
  pinned: boolean;
  priority: number;
  lastUsed: number;
  promise: Promise<void> | null;
}

export interface ResidencyStats {
  resident: number;
  pending: number;
  bytesEstimate: number;
  hits: number;
  misses: number;
  evictions: number;
}

export function createResidencyManager<T>(opts: {
  load: LoadFn<T>;
  dispose: DisposeFn<T>;
  maxBytes: number;
  now: () => number;
}) {
  const { load, dispose, maxBytes, now } = opts;
  const entries = new Map<string, Entry<T>>();
  let hits = 0;
  let misses = 0;
  let evictions = 0;

  const touch = (e: Entry<T>) => {
    e.lastUsed = now();
  };

  /** Declare interest. Starts (or joins, or retries) the load. Returns texture or null. */
  function request(url: string, priority: number): T | null {
    let e = entries.get(url);
    if (e && e.status !== "failed") {
      hits++;
      e.priority = Math.max(e.priority, priority);
      touch(e);
      return e.status === "ready" ? e.texture : null;
    }
    misses++;
    if (!e) {
      e = { url, status: "pending", texture: null, bytes: 0, refs: 0, pinned: false, priority, lastUsed: now(), promise: null };
      entries.set(url, e);
    } else {
      e.status = "pending";
      e.texture = null;
      e.bytes = 0;
      e.priority = priority;
      touch(e);
    }
    kick(e);
    return null;
  }

  function kick(e: Entry<T>): void {
    e.promise = load(e.url).then(
      ({ texture, bytes }) => {
        const cur = entries.get(e.url);
        if (!cur || cur !== e) {
          dispose(texture); // cancelled or superseded while in flight
          return;
        }
        cur.status = "ready";
        cur.texture = texture;
        cur.bytes = bytes;
        touch(cur);
        evictIfNeeded();
      },
      () => {
        const cur = entries.get(e.url);
        if (cur && cur === e) {
          cur.status = "failed";
          cur.promise = null;
        }
      }
    );
  }

  /** Hard retain: pinned entries are never evicted (global fallbacks live here). */
  function pin(url: string): void {
    const e = entries.get(url);
    if (e) e.pinned = true;
    else entries.set(url, { url, status: "pending", texture: null, bytes: 0, refs: 0, pinned: true, priority: 0, lastUsed: now(), promise: null });
  }

  function acquire(url: string): void {
    const e = entries.get(url);
    if (e) {
      e.refs++;
      touch(e);
    }
  }

  function release(url: string): void {
    const e = entries.get(url);
    if (e && e.refs > 0) {
      e.refs--;
      touch(e);
    }
  }

  /** Drop a pending request. In-flight loads dispose themselves on arrival. */
  function cancel(url: string): void {
    const e = entries.get(url);
    if (!e || e.refs > 0 || e.pinned) return;
    if (e.status === "pending" && e.texture === null) {
      entries.delete(url);
      return;
    }
    if (e.status === "ready" && e.texture) dispose(e.texture);
    entries.delete(url);
  }

  function evictIfNeeded(): void {
    const resident = [...entries.values()].filter((e) => e.status === "ready");
    let total = resident.reduce((s, e) => s + e.bytes, 0);
    if (total <= maxBytes) return;
    // LRU among unreferenced, unpinned entries only. Referenced or pinned
    // textures (visible objects, global fallbacks) are never evicted.
    const victims = resident
      .filter((e) => e.refs === 0 && !e.pinned)
      .sort((a, b) => a.lastUsed - b.lastUsed || a.priority - b.priority);
    for (const v of victims) {
      if (total <= maxBytes) break;
      if (v.texture) dispose(v.texture);
      entries.delete(v.url);
      total -= v.bytes;
      evictions++;
    }
  }

  function stats(): ResidencyStats {
    let resident = 0;
    let pending = 0;
    let bytesEstimate = 0;
    for (const e of entries.values()) {
      if (e.status === "ready") {
        resident++;
        bytesEstimate += e.bytes;
      } else if (e.status === "pending") pending++;
    }
    return { resident, pending, bytesEstimate, hits, misses, evictions };
  }

  function get(url: string): T | null {
    const e = entries.get(url);
    if (e && e.status === "ready") {
      touch(e);
      return e.texture;
    }
    return null;
  }

  /** Debug introspection: per-entry state (harness probes + DevPanel). */
  function describe(): Array<{ url: string; status: Entry<T>["status"]; bytes: number }> {
    return [...entries.values()].map((e) => ({ url: e.url, status: e.status, bytes: e.bytes }));
  }

  return { request, pin, acquire, release, cancel, stats, get, describe };
}

export type ResidencyManager<T> = ReturnType<typeof createResidencyManager<T>>;

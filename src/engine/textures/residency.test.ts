import { describe, expect, it, vi } from "vitest";
import { createResidencyManager } from "./residency";

type T = { url: string };
const immediate = (url: string) => Promise.resolve({ texture: { url }, bytes: 100 });
const dispose = vi.fn();

function mgr(load = immediate, maxBytes = 10_000, t = { n: 0 }) {
  return createResidencyManager<T>({ load, dispose, maxBytes, now: () => t.n });
}
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("residency manager", () => {
  it("dedups concurrent requests into one load", async () => {
    const load = vi.fn(immediate);
    const m = mgr(load);
    expect(m.request("a", 1)).toBeNull();
    expect(m.request("a", 5)).toBeNull();
    await tick();
    expect(load).toHaveBeenCalledTimes(1);
    expect(m.get("a")).toEqual({ url: "a" });
  });

  it("tracks hits and misses", async () => {
    const m = mgr();
    m.request("a", 1);
    m.request("b", 1);
    await tick();
    m.request("a", 1);
    const s = m.stats();
    expect(s.misses).toBe(2);
    expect(s.hits).toBe(1);
    expect(s.resident).toBe(2);
    expect(s.bytesEstimate).toBe(200);
  });

  it("never evicts referenced or pinned textures", async () => {
    const disposed: string[] = [];
    const m = createResidencyManager<T>({ load: immediate, dispose: (t) => void disposed.push(t.url), maxBytes: 250, now: () => 0 });
    m.request("keep", 1);
    m.pin("keep"); // pinned while still pending: protection starts immediately
    m.request("drop", 1);
    await tick();
    m.acquire("keep");
    m.request("third", 1);
    await tick();
    await tick();
    expect(m.get("keep")).toBeTruthy();
    expect(m.get("drop")).toBeNull();
    expect(disposed).toEqual(["drop"]);
    expect(m.stats().evictions).toBe(1);
  });

  it("evicts least-recently-used first", async () => {
    const disposed: string[] = [];
    let n = 0;
    const m = createResidencyManager<T>({ load: immediate, dispose: (t) => void disposed.push(t.url), maxBytes: 250, now: () => n });
    m.request("old", 1);
    await tick();
    n = 10;
    m.request("new", 1);
    await tick();
    n = 11;
    m.get("new");
    n = 20;
    m.request("third", 1);
    await tick();
    await tick();
    expect(m.get("old")).toBeNull();
    expect(m.get("new")).toBeTruthy();
  });

  it("cancel drops pending requests and disposes late arrivals", async () => {
    let resolveIt!: (v: { texture: T; bytes: number }) => void;
    const load = vi.fn(() => new Promise<{ texture: T; bytes: number }>((r) => (resolveIt = r)));
    const disposed: string[] = [];
    const m = createResidencyManager<T>({ load, dispose: (t) => void disposed.push(t.url), maxBytes: 10_000, now: () => 0 });
    m.request("x", 1);
    m.cancel("x");
    resolveIt({ texture: { url: "x" }, bytes: 10 });
    await tick();
    expect(m.get("x")).toBeNull();
    expect(disposed).toEqual(["x"]);
    expect(m.stats().pending).toBe(0);
  });

  it("records failures without poisoning the cache", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("net")).mockImplementation(immediate);
    const m = mgr(load);
    m.request("bad", 1);
    await tick();
    await tick();
    expect(m.get("bad")).toBeNull();
    // a later retry succeeds (fallback path stays usable)
    m.request("bad", 1);
    await tick();
    expect(m.get("bad")).toBeTruthy();
  });

  it("release never drives refcounts negative", async () => {
    const m = mgr(immediate, 150);
    m.request("a", 1);
    await tick();
    m.release("a");
    m.release("a"); // must stay at zero, not wrap
    m.request("b", 1);
    await tick();
    await tick();
    expect(m.stats().resident).toBe(1);
  });
});

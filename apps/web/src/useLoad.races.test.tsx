import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useLoad } from "./ui";
function deferred<T>() {
  let resolve!: (data: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((good, bad) => { resolve = good; reject = bad; });
  return { promise, resolve, reject };
}
describe("useLoad stale dependency protection", () => {
  it("ignores older success after a newer dependency resolves", async () => {
    const a = deferred<string>(), b = deferred<string>();
    const { result, rerender } = renderHook(({ asset }) => useLoad(() => asset === "A" ? a.promise : b.promise, [asset]), { initialProps: { asset: "A" } });
    rerender({ asset: "B" });
    await act(async () => b.resolve("newer"));
    await waitFor(() => expect(result.current.data).toBe("newer"));
    await act(async () => a.resolve("stale"));
    expect(result.current).toMatchObject({ data: "newer", loading: false, error: undefined });
  });
  it("ignores older rejection after newer data and unmounts safely", async () => {
    const a = deferred<string>(), b = deferred<string>();
    const load = vi.fn((asset: string) => asset === "A" ? a.promise : b.promise);
    const { result, rerender, unmount } = renderHook(({ asset }) => useLoad(() => load(asset), [asset]), { initialProps: { asset: "A" } });
    rerender({ asset: "B" });
    await act(async () => b.resolve("B-result"));
    await act(async () => a.reject(new Error("old request failed")));
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toBe("B-result");
    unmount();
  });
  it("ignores resolution after unmount", async () => {
    const a = deferred<string>();
    const { unmount } = renderHook(() => useLoad(() => a.promise, []));
    unmount();
    await act(async () => a.resolve("late"));
  });
});

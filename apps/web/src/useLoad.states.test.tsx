import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLoad } from "./ui";
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (v: Error) => void;
  const promise = new Promise<T>((a,b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}
describe("useLoad previous-data retention", () => {
  it("transitions loading → data → stale data reloading → error with data → recovered", async () => {
    const first = deferred<number>(), second = deferred<number>(), third = deferred<number>();
    const calls = [first, second, third];
    let count = 0;
    const { result } = renderHook(() => useLoad(() => calls[count++]!.promise, []));
    expect(result.current).toMatchObject({ loading: true, data: undefined });
    const reload = result.current.reload;
    await act(async () => first.resolve(1));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ data: 1, error: undefined });
    act(() => result.current.reload());
    expect(result.current).toMatchObject({ loading: true, data: 1 });
    await act(async () => second.reject(new Error("temporary disconnect")));
    expect(result.current).toMatchObject({ loading: false, data: 1, error: "temporary disconnect" });
    act(() => result.current.reload());
    await act(async () => third.resolve(3));
    expect(result.current).toMatchObject({ loading: false, data: 3, error: undefined });
    expect(result.current.reload).toBe(reload);
  });
});

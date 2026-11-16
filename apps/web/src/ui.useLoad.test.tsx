import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useLoad } from "./ui";

describe("useLoad reload lifecycle (#855)", () => {
  it("retains prior data through reload failures and clears stale errors after recovery", async () => {
    const pending: Array<{
      resolve: (value: string) => void;
      reject: (reason: Error) => void;
    }> = [];
    const load = vi.fn(() => new Promise<string>((resolve, reject) => pending.push({ resolve, reject })));
    const { result } = renderHook(() => useLoad(load, []));

    expect(result.current).toMatchObject({ loading: true, data: undefined, error: undefined });
    expect(load).toHaveBeenCalledTimes(1);

    await act(async () => pending[0]?.resolve("first"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ data: "first", error: undefined });

    const reload = result.current.reload;
    act(() => result.current.reload());
    expect(result.current.reload).toBe(reload);
    expect(result.current).toMatchObject({ loading: true, data: "first", error: undefined });
    expect(load).toHaveBeenCalledTimes(2);

    await act(async () => pending[1]?.reject(new Error("Temporary outage")));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ data: "first", error: "Temporary outage" });

    act(() => result.current.reload());
    expect(result.current.reload).toBe(reload);
    expect(result.current).toMatchObject({ loading: true, data: "first", error: "Temporary outage" });
    expect(load).toHaveBeenCalledTimes(3);

    await act(async () => pending[2]?.resolve("second"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ data: "second", error: undefined });
  });
});

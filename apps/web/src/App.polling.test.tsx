import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useVisiblePolling } from "./App";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("dashboard background polling", () => {
  it("does not send periodic refreshes when hidden, and refreshes once on return", () => {
    vi.useFakeTimers();
    let hidden = false;
    vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
    const reload = vi.fn();
    const { rerender, unmount } = renderHook(({ interval }) => useVisiblePolling(reload, interval), {
      initialProps: { interval: 4000 },
    });
    act(() => vi.advanceTimersByTime(4000));
    expect(reload).toHaveBeenCalledTimes(1);
    hidden = true;
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    act(() => vi.advanceTimersByTime(120_000));
    expect(reload).toHaveBeenCalledTimes(1);
    hidden = false;
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(reload).toHaveBeenCalledTimes(2);
    act(() => vi.advanceTimersByTime(4000));
    expect(reload).toHaveBeenCalledTimes(3);
    rerender({ interval: 30_000 });
    act(() => vi.advanceTimersByTime(4000));
    expect(reload).toHaveBeenCalledTimes(3);
    act(() => vi.advanceTimersByTime(26_000));
    expect(reload).toHaveBeenCalledTimes(4);
    unmount();
    act(() => vi.advanceTimersByTime(120_000));
    expect(reload).toHaveBeenCalledTimes(4);
  });
});

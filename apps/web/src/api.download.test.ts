import { afterEach, describe, expect, it, vi } from "vitest";
import { download } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("audit pack download", () => {
  it("keeps blob URL alive after click and releases it after the browser can begin", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(new Blob(["audit"]), { status: 200 }),
    );
    const create = vi.fn(() => "blob:concord-audit");
    const revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.isConnected).toBe(true);
      expect(this.download).toBe("audit.json");
      expect(this.href).toContain("blob:concord-audit");
    });
    await download("/assets/TEST/export", "audit.json");
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a[download]')).toBeNull();
    expect(revoke).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(revoke).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith("blob:concord-audit");
  });
});

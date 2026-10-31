import { afterEach, describe, expect, it, vi } from "vitest";
import { download } from "./api";

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("download response filename and blob cleanup", () => {
  it.each([
    ['attachment; filename="concord-FUND-audit-2026-10-06.json"', "concord-FUND-audit-2026-10-06.json"],
    [null, "fallback.json"],
  ])("uses Content-Disposition filename %s", async (header, expected) => {
    vi.useFakeTimers();
    const url = vi.fn(() => "blob:example");
    const revoke = vi.fn();
    const original = URL;
    class MockURL extends original {}
    MockURL.createObjectURL = url;
    MockURL.revokeObjectURL = revoke;
    vi.stubGlobal("URL", MockURL);
    const headers: Record<string, string> = header ? { "content-disposition": header } : {};
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200, headers })));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe(expected);
      expect(revoke).not.toHaveBeenCalled();
      expect(document.body.contains(this)).toBe(true);
    });
    await download("/assets/FUND/export", "fallback.json");
    expect(click).toHaveBeenCalledOnce();
    expect(url).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(10_000);
    expect(revoke).toHaveBeenCalledWith("blob:example");
  });
  it("does not create or revoke a blob on HTTP error", async () => {
    class MockURL extends URL {}
    MockURL.createObjectURL = vi.fn();
    MockURL.revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", MockURL);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "No pack" }, { status: 404 })));
    await expect(download("/assets/FUND/export", "fallback.json")).rejects.toMatchObject({ status: 404, message: "No pack" });
    expect(MockURL.createObjectURL).not.toHaveBeenCalled();
    expect(MockURL.revokeObjectURL).not.toHaveBeenCalled();
  });
});

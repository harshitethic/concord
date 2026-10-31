import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, UNAUTHORIZED, api } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("protected API errors and session expiry", () => {
  it("dispatches exactly once for protected 401, preserving the error and status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "Sign in to continue." }, { status: 401 })));
    const event = vi.fn();
    window.addEventListener(UNAUTHORIZED, event);
    try {
      await expect(api("/assets")).rejects.toEqual(new ApiError("Sign in to continue.", 401));
      expect(event).toHaveBeenCalledOnce();
    } finally {
      window.removeEventListener(UNAUTHORIZED, event);
    }
  });
  it.each([403, 404, 409, 500])("never dispatches session expiry for HTTP %s", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "Server message" }, { status })));
    const event = vi.fn();
    window.addEventListener(UNAUTHORIZED, event);
    try {
      await expect(api("/assets")).rejects.toMatchObject({ status, message: "Server message" });
      expect(event).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(UNAUTHORIZED, event);
    }
  });
  it("returns a meaningful fallback for a non-JSON HTTP failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<h1>Bad gateway</h1>", { status: 502 })));
    await expect(api("/overview")).rejects.toEqual(new ApiError("Request failed (502)", 502));
  });
});

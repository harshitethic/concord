import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, UNAUTHORIZED, api } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API error and session-expiry contract (#851)", () => {
  it("dispatches UNAUTHORIZED for a protected 401 and preserves the server message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ error: "Sign in to continue." }, { status: 401 })),
    );
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED, listener);
    try {
      await expect(api("/overview")).rejects.toEqual(new ApiError("Sign in to continue.", 401));
      expect(listener).toHaveBeenCalledOnce();
    } finally {
      window.removeEventListener(UNAUTHORIZED, listener);
    }
  });

  it("does not dispatch session expiry on other HTTP errors and retains their statuses", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ error: "Forbidden" }, { status: 403 }))
      .mockResolvedValueOnce(Response.json({ error: "Asset not found" }, { status: 404 }))
      .mockResolvedValueOnce(Response.json({ error: "Internal error" }, { status: 500 }))
      .mockResolvedValueOnce(Response.json({ error: "Workspace changed" }, { status: 409 }))
      .mockResolvedValueOnce(new Response("<html>Bad gateway</html>", { status: 502 }));
    vi.stubGlobal("fetch", fetchMock);
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED, listener);
    try {
      await expect(api("/assets")).rejects.toEqual(new ApiError("Forbidden", 403));
      await expect(api("/assets/missing")).rejects.toEqual(new ApiError("Asset not found", 404));
      await expect(api("/overview")).rejects.toEqual(new ApiError("Internal error", 500));
      await expect(api("/overview")).rejects.toEqual(new ApiError("Workspace changed", 409));
      await expect(api("/overview")).rejects.toEqual(new ApiError("Request failed (502)", 502));
      expect(fetchMock).toHaveBeenCalledTimes(5);
      expect(listener).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(UNAUTHORIZED, listener);
    }
  });

  it("does not end a valid session on a credential-entry 401", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "Wrong credentials" }, { status: 401 })));
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED, listener);
    try {
      await expect(
        api("/auth/signin", { body: { email: "a@example.org", password: "invalid" } }),
      ).rejects.toMatchObject({
        status: 401,
        message: "Wrong credentials",
      });
      expect(listener).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(UNAUTHORIZED, listener);
    }
  });
});

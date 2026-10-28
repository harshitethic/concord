import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, UNAUTHORIZED, WORKSPACE_MISMATCH, api } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("api successful response parsing", () => {
  it("surfaces a useful ApiError rather than raw SyntaxError for HTML 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("<html>Login required</html>", { status: 200, headers: { "content-type": "text/html" } }),
        ),
    );
    await expect(api("/account")).rejects.toMatchObject({
      name: "Error",
      status: 200,
      message: "The server sent an unexpected response.",
    });
  });

  it("permits empty successful 204 responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(api<void>("/session", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("continues to parse normal JSON responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ready: true })));
    await expect(api<{ ready: boolean }>("/ready")).resolves.toEqual({ ready: true });
  });

  it("does not change failed HTTP status handling", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "Access forbidden" }, { status: 403 })));
    await expect(api("/protected")).rejects.toEqual(new ApiError("Access forbidden", 403));
  });
});

describe("offline API failures", () => {
  it("converts fetch network errors into a friendly status-0 ApiError without expiring the session", async () => {
    expect.assertions(6);

    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);
    const unauthorized = vi.fn();
    window.addEventListener(UNAUTHORIZED, unauthorized);

    try {
      await api("/register");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err).toBeInstanceOf(Error);
      expect((err as ApiError).status).toBe(0);
      expect((err as Error).message).toBe("The Concord server is not reachable. Check your connection and try again.");
    } finally {
      window.removeEventListener(UNAUTHORIZED, unauthorized);
    }

    expect(unauthorized).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});


describe("stale workspace protection", () => {
  it("broadcasts the exact workspace-conflict 409 with its typed status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(
      { error: "This tab is showing a different workspace. Reload it." }, { status: 409 },
    )));
    const onMismatch = vi.fn();
    const onUnauthorized = vi.fn();
    window.addEventListener(WORKSPACE_MISMATCH, onMismatch);
    window.addEventListener(UNAUTHORIZED, onUnauthorized);
    try {
      await expect(api("/overview")).rejects.toEqual(
        new ApiError("This tab is showing a different workspace. Reload it.", 409),
      );
      expect(onMismatch).toHaveBeenCalledOnce();
      expect(onUnauthorized).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(WORKSPACE_MISMATCH, onMismatch);
      window.removeEventListener(UNAUTHORIZED, onUnauthorized);
    }
  });

  it("does not lock the UI on unrelated conflicts or HTTP failures", async () => {
    const onMismatch = vi.fn();
    window.addEventListener(WORKSPACE_MISMATCH, onMismatch);
    try {
      for (const status of [403, 409, 500]) {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "Other failure" }, { status })));
        await expect(api("/register")).rejects.toMatchObject({ status, message: "Other failure" });
      }
      expect(onMismatch).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(WORKSPACE_MISMATCH, onMismatch);
    }
  });
});

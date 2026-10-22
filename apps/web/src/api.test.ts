import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, UNAUTHORIZED, api } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
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

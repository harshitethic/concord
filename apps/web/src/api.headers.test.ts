import { afterEach, describe, expect, it, vi } from "vitest";
import { api, showOrg } from "./api";

afterEach(() => {
  showOrg(undefined);
  vi.unstubAllGlobals();
});

describe("workspace context and JSON request headers", () => {
  it("adds workspace context only while selected and defaults to the correct HTTP method", async () => {
    const calls: Array<{ path: string; init: RequestInit }> = [];
    vi.stubGlobal("fetch", vi.fn(async (path: string, init: RequestInit) => {
      calls.push({ path, init });
      return Response.json({ ok: true });
    }));
    showOrg(undefined);
    await api("/health");
    showOrg("org-abc");
    await api("/overview");
    await api("/assets", { body: { asset: "USD" } });
    showOrg(undefined);
    await api("/health");
    expect(calls).toHaveLength(4);
    expect(calls.map((x) => x.init.credentials)).toEqual(["same-origin", "same-origin", "same-origin", "same-origin"]);
    expect(calls[0]!.init.method).toBe("GET");
    expect(calls[0]!.init.headers).not.toHaveProperty("x-concord-org");
    expect(calls[1]!.init.headers).toMatchObject({ "x-concord-org": "org-abc" });
    expect(calls[1]!.init.headers).not.toHaveProperty("content-type");
    expect(calls[2]!.init.method).toBe("POST");
    expect(calls[2]!.init.headers).toMatchObject({ "x-concord-org": "org-abc", "content-type": "application/json" });
    expect(JSON.parse(String(calls[2]!.init.body))).toEqual({ asset: "USD" });
    expect(calls[3]!.init.headers).not.toHaveProperty("x-concord-org");
  });
});

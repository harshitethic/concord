import { afterEach, describe, expect, it, vi } from "vitest";
import { api, showOrg } from "./api";

afterEach(() => {
  showOrg(undefined);
  vi.unstubAllGlobals();
});

describe("API request workspace context (#849)", () => {
  it("includes x-concord-org only while a workspace is shown", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(Response.json({ ok: true })));
    vi.stubGlobal("fetch", fetchMock);

    showOrg(undefined);
    await api("/overview");
    showOrg("workspace-abc");
    await api("/overview");
    showOrg(undefined);
    await api("/overview");

    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    expect(calls.map(([path]) => path)).toEqual(["/api/overview", "/api/overview", "/api/overview"]);
    expect(calls[0]?.[1].headers).toEqual({});
    expect(calls[1]?.[1].headers).toEqual({ "x-concord-org": "workspace-abc" });
    expect(calls[2]?.[1].headers).toEqual({});
    expect(calls.every(([, init]) => init.credentials === "same-origin")).toBe(true);
  });

  it("sends JSON content-type only with a body and infers the HTTP method", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(Response.json({ ok: true })));
    vi.stubGlobal("fetch", fetchMock);

    await api("/overview");
    await api("/actions", { body: { label: "Review" } });
    await api("/actions/1", { method: "DELETE" });

    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    expect(calls[0]?.[1]).toMatchObject({ method: "GET", headers: {} });
    expect(calls[0]?.[1]).not.toHaveProperty("body");
    expect(calls[1]?.[1]).toMatchObject({
      method: "POST",
      headers: { "content-type": "application/json" },
      body: '{"label":"Review"}',
    });
    expect(calls[2]?.[1]).toMatchObject({ method: "DELETE", headers: {} });
    expect(calls[2]?.[1]).not.toHaveProperty("body");
  });
});

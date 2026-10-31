import { vi } from "vitest";
export interface RecordedRequest {
  method: string;
  path: string;
  headers: Headers;
  body?: unknown;
}
export type MockRoute = unknown | ((request: RecordedRequest) => unknown | Promise<unknown>);
export interface ApiFixture {
  requests: RecordedRequest[];
  unexpected: string[];
  assertNoUnexpected(): void;
}
/** Test-only route table for the real api() wrapper and dashboard components. */
export function mockApi(routes: Record<string, MockRoute>): ApiFixture {
  const requests: RecordedRequest[] = [];
  const unexpected: string[] = [];
  const fetcher = vi.fn(async (input: string | URL | Request, init: RequestInit = {}): Promise<Response> => {
    const full = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const parsed = new URL(full, "http://localhost");
    const path = parsed.pathname.replace(/^\/api/, "") + parsed.search;
    const method = (init.method ?? "GET").toUpperCase();
    const headers = new Headers(init.headers);
    let body: unknown = undefined;
    if (typeof init.body === "string") {
      try { body = JSON.parse(init.body); }
      catch { body = init.body; }
    }
    const call = { method, path, headers, ...(body === undefined ? {} : { body }) };
    requests.push(call);
    const key = method + " " + path;
    if (!Object.prototype.hasOwnProperty.call(routes, key)) {
      unexpected.push(key);
      return Response.json({ error: "Unexpected API request: " + key }, { status: 404 });
    }
    const answer = routes[key];
    const resolved = typeof answer === "function" ? await (answer as (request: RecordedRequest) => unknown)(call) : answer;
    return resolved instanceof Response ? resolved : Response.json(resolved);
  });
  vi.stubGlobal("fetch", fetcher);
  return {
    requests,
    unexpected,
    assertNoUnexpected() {
      if (unexpected.length > 0) throw new Error("Unexpected API requests: " + unexpected.join(", "));
    },
  };
}

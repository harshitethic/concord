import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SessionProvider, useSession } from "./session";
import { api, showOrg } from "./api";

const config = { signup: "open", google: false, ephemeral: false, networks: ["mainnet"], defaultNetwork: "mainnet" };
const me = { user: { id: "u", name: "User", email: "user@example.com", hasPassword: true, hasGoogle: false }, org: { id: "org-1", name: "Workspace" }, role: "owner", orgs: [{ id: "org-1", name: "Workspace", role: "owner" }] };
function Panel() { const { me: active } = useSession(); return <div data-testid="session">{active?.org.id ?? "signed-out"}</div>; }
function mount() {
  return render(<SessionProvider fallback={error => <span data-testid="fallback">{error ?? "Loading"}</span>}><Panel /></SessionProvider>);
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); showOrg(undefined); localStorage.clear(); });
describe("session bootstrap", () => {
  it("waits for configuration then session, removes legacy credentials and attaches workspace context", async () => {
    localStorage.setItem("concord.token", "old-token");
    localStorage.setItem("concord.author", "old");
    let finishSession!: (res: Response) => void;
    const session = new Promise<Response>(resolve => { finishSession = resolve; });
    const fetcher = vi.fn((path: string, init?: RequestInit) => path.endsWith("/config") ? Promise.resolve(Response.json(config)) : path.endsWith("/session") ? session : Promise.resolve(Response.json({ ok: true })));
    vi.stubGlobal("fetch", fetcher);
    mount();
    await waitFor(() => expect(fetcher).toHaveBeenCalledWith("/api/auth/session", expect.anything()));
    expect(screen.getByTestId("fallback")).toHaveTextContent("Loading");
    expect(localStorage.getItem("concord.token")).toBeNull();
    expect(localStorage.getItem("concord.author")).toBeNull();
    await act(async () => finishSession(Response.json({ me })));
    expect(await screen.findByTestId("session")).toHaveTextContent("org-1");
    await api("/overview");
    const x = fetcher.mock.calls.find(([path]) => path === "/api/overview");
    expect(x?.[1]?.headers).toMatchObject({ "x-concord-org": "org-1" });
  });
  it("renders signed-out children when session returns null", async () => {
    vi.stubGlobal("fetch", vi.fn(async (path: string) => Response.json(path.endsWith("/config") ? config : { me: null })));
    mount();
    expect(await screen.findByTestId("session")).toHaveTextContent("signed-out");
  });
  it.each(["config", "session"])("retains fallback and shows a %s failure", async (part) => {
    vi.stubGlobal("fetch", vi.fn(async (path: string) => {
      if (path.endsWith(part === "config" ? "/config" : "/session")) return Response.json({ error: part + " unavailable" }, { status: 503 });
      return Response.json(path.endsWith("/config") ? config : { me: null });
    }));
    mount();
    expect(await screen.findByTestId("fallback")).toHaveTextContent(part + " unavailable");
    expect(screen.queryByTestId("session")).toBeNull();
  });
});

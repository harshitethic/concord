import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { api } from "./api";
import { Badge } from "./ui";

vi.mock("./session", () => {
  const me = {
    org: { id: "org-a", name: "Test workspace" },
    user: { email: "tester@example.org", name: "Tester", id: "user-a", hasPassword: true, hasGoogle: false },
    role: "owner",
    orgs: [],
  };
  return {
    SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useMe: () => me,
    useSession: () => ({
      me,
      config: { networks: ["mainnet"], defaultNetwork: "mainnet", ephemeral: false, google: false },
      network: "mainnet",
      setNetwork: vi.fn(),
      signOut: vi.fn(),
    }),
  };
});
vi.mock("./Overview", () => ({ Overview: () => <div>Overview is ready</div> }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.location.hash = "#/";
});

describe("dashboard test harness", () => {
  it("renders a Badge with accessible text", () => {
    render(<Badge tone="ok">Reconciled</Badge>);
    expect(screen.getByText("Reconciled")).toBeInTheDocument();
  });
});

describe("stale-workspace guard", () => {
  it("blocks stale workspace interactions and cancels polling on the 409 event", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ networks: ["mainnet"], assets: [] }))
      .mockResolvedValueOnce(Response.json({ error: "This tab is showing a different workspace. Reload it." }, { status: 409 }));
    vi.stubGlobal("fetch", fetchMock);
    const clearInterval = vi.spyOn(window, "clearInterval");
    render(<App />);
    expect(await screen.findByText("Overview is ready")).toBeInTheDocument();

    await expect(api("/register")).rejects.toMatchObject({ status: 409 });
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("This tab is showing a different workspace");
    expect(screen.getByRole("button", { name: "Reload Concord" })).toBeInTheDocument();
    expect(screen.queryByText("Overview is ready")).not.toBeInTheDocument();
    await waitFor(() => expect(clearInterval).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

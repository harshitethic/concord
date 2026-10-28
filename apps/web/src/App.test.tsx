import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
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
vi.mock("./Overview", () => ({ Overview: () => <div>Overview ready</div> }));

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

describe("overview freshness indicators", () => {
  it("updates the success timestamp and refreshes immediately when requested", async () => {
    let release: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ assets: [], networks: ["mainnet"] }))
      .mockImplementationOnce(() => new Promise<Response>((resolve) => { release = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    expect(await screen.findByText("Overview ready")).toBeInTheDocument();
    expect(await screen.findByText(/Updated 0s ago/)).toBeInTheDocument();
    const refresh = screen.getByRole("button", { name: "Refresh" });
    await userEvent.click(refresh);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(refresh).toBeDisabled();
    release!(Response.json({ assets: [], networks: ["mainnet"] }));
    await waitFor(() => expect(refresh).toBeEnabled());
    expect(screen.getByText(/Updated 0s ago/)).toBeInTheDocument();
  });

  it("warns after two consecutive failures and clears the warning on recovery", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ assets: [], networks: ["mainnet"] }))
      .mockResolvedValueOnce(Response.json({ error: "server unavailable" }, { status: 500 }))
      .mockResolvedValueOnce(Response.json({ error: "server unavailable" }, { status: 500 }))
      .mockResolvedValueOnce(Response.json({ assets: [], networks: ["mainnet"] }));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    expect(await screen.findByText("Overview ready")).toBeInTheDocument();
    const refresh = screen.getByRole("button", { name: "Refresh" });
    const user = userEvent.setup();
    await user.click(refresh);
    await waitFor(() => expect(refresh).toBeEnabled());
    expect(screen.queryByText("Updates delayed")).not.toBeInTheDocument();
    await user.click(refresh);
    expect(await screen.findByText("Updates delayed")).toBeInTheDocument();
    await waitFor(() => expect(refresh).toBeEnabled());
    await user.click(refresh);
    await waitFor(() => expect(screen.queryByText("Updates delayed")).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});

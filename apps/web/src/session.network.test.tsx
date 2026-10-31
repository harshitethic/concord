import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SessionProvider, useSession } from "./session";
import { showOrg } from "./api";
const cfg = { signup: "open", google: false, ephemeral: false, networks: ["mainnet", "testnet"], defaultNetwork: "mainnet" };
function NetworkPanel() {
  const { network, setNetwork } = useSession();
  return <><div data-testid="network">{network}</div><button onClick={() => setNetwork("testnet")}>Testnet</button></>;
}
function mount(config = cfg) {
  vi.stubGlobal("fetch", vi.fn(async (path: string) => Response.json(path.endsWith("/config") ? config : { me: null })));
  return render(<SessionProvider fallback={() => <div>Loading</div>}><NetworkPanel /></SessionProvider>);
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); showOrg(undefined); localStorage.clear(); });
describe("session network preference resilience", () => {
  it("restores a supported stored network", async () => {
    localStorage.setItem("concord.network", "testnet");
    mount();
    expect(await screen.findByTestId("network")).toHaveTextContent("testnet");
  });
  it("falls back when stored network is not allowed by config", async () => {
    localStorage.setItem("concord.network", "testnet");
    mount({ ...cfg, networks: ["mainnet"] });
    expect(await screen.findByTestId("network")).toHaveTextContent("mainnet");
  });
  it("ignores garbage and denied reads", async () => {
    localStorage.setItem("concord.network", "garbage");
    mount();
    expect(await screen.findByTestId("network")).toHaveTextContent("mainnet");
  });
  it("survives storage read exceptions", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    mount();
    expect(await screen.findByTestId("network")).toHaveTextContent("mainnet");
  });
  it("changes network even if saving the preference fails", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    mount();
    await screen.findByTestId("network");
    await userEvent.click(screen.getByRole("button", { name: "Testnet" }));
    await waitFor(() => expect(screen.getByTestId("network")).toHaveTextContent("testnet"));
  });
});

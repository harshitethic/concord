import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Events } from "./tabs/Events";
import { api, type AssetSummary, type ChainEvent } from "./api";
vi.mock("./api", async (importOriginal) => ({ ...(await importOriginal<typeof import("./api")>()), api: vi.fn() }));
const asset = { id:"a", network:"mainnet", state:"ready", code:"AAA", syncedLedger:42 } as AssetSummary;
const entries = Array.from({length:101},(_,i)=>({ id: String(101-i).padStart(4,'0'), ledger:42,
  kind:"mint", closedAt:"2026-10-01T00:00:00Z", txHash:"abc", from:null, to:null, units:"1", authorized:null } as ChainEvent));
afterEach(()=>vi.clearAllMocks());
describe("event pagination lookahead", () => {
  it("hides Load older when exactly 100 records exist", async () => {
    vi.mocked(api).mockResolvedValue(entries.slice(0,100));
    render(<Events asset={asset} />);
    await waitFor(() => expect(document.querySelectorAll("tbody tr")).toHaveLength(100));
    expect(screen.queryByRole("button", { name:"Load older" })).not.toBeInTheDocument();
    expect(vi.mocked(api).mock.calls[0]?.[0]).toContain("limit=101");
  });
  it("loads the 101st event only when a lookahead row exists", async () => {
    vi.mocked(api).mockImplementation(async (path) => path.includes("before=") ? entries.slice(100) : entries);
    render(<Events asset={asset} />);
    const older = await screen.findByRole("button", { name:"Load older" });
    await userEvent.click(older);
    await waitFor(() => expect(screen.queryByRole("button", {name:"Load older"})).not.toBeInTheDocument());
    expect(document.querySelectorAll("tbody tr")).toHaveLength(101);
    expect(vi.mocked(api).mock.calls[1]?.[0]).toContain("before=0002");
  });
});

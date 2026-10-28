import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Overview, visibleAssets } from "./Overview";
import type { AssetSummary } from "./api";
const make = (id: string, code: string, supply: string, breaks: number, syncedAt: string, syncError?: string): AssetSummary => ({
  id, name: `Asset ${id}`, code, network: "mainnet", supply, holderCount: 2, state: "ready",
  syncedAt, syncError, openBreaks: { reconciliation: breaks, controls: 0, actions: 0 },
  lastRun: null,
} as AssetSummary);
const assets = [
  make("A", "AAA", "999999999999999.0000001", 2, "2026-10-01"),
  make("B", "BBB", "0.25", 0, "2026-10-05"),
  make("C", "CCC", "100", 3, "2026-10-02"),
  make("D", "DDD", "10", 0, "2026-10-06", "poll failed"),
  make("E", "EEE", "100", 3, "2026-10-03"),
];
describe("watched assets searching and sorting", () => {
  it("sorts huge exact balances and preserves original order for equal values", () => {
    expect(visibleAssets(assets, "", false, "units", true).map(a=>a.id)).toEqual(["A","C","E","D","B"]);
    expect(visibleAssets(assets, "", false, "breaks", true).map(a=>a.id)).toEqual(["C","E","A","B","D"]);
    expect(visibleAssets(assets, "", true, "default", true).map(a=>a.id)).toEqual(["A","C","D","E"]);
    expect(visibleAssets(assets, "bbb", false, "default", false).map(a=>a.id)).toEqual(["B"]);
  });
  it("exposes sortable keyboard buttons and retains filters across data refresh", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Overview assets={assets} network="mainnet" onChange={vi.fn()} />);
    await user.type(screen.getByLabelText("Search assets by name or code"), "C");
    expect(screen.getByRole("link", { name: "Asset C" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Asset A" })).not.toBeInTheDocument();
    rerender(<Overview assets={[...assets]} network="mainnet" onChange={vi.fn()} />);
    expect(screen.getByLabelText("Search assets by name or code")).toHaveValue("C");
    await user.clear(screen.getByLabelText("Search assets by name or code"));
    await user.click(screen.getByRole("button", { name: "Open breaks" }));
    expect(within(screen.getByRole("columnheader", { name: "Open breaks" })).getByRole("button")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Open breaks" })).toHaveAttribute("aria-sort", "descending");
    await user.click(screen.getByLabelText("Needs attention"));
    expect(screen.queryByRole("link", { name: "Asset B" })).not.toBeInTheDocument();
  });
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Overview, visibleAssets } from "./Overview";
import type { AssetSummary } from "./api";

function asset(id: string, code: string, supply: string, open: number, syncedAt?: string, syncError?: string): AssetSummary {
  return {
    id, code, name: `Asset ${code}`, network: "mainnet", decimals: 7, supply, holderCount: 2,
    state: "ready", startMode: "baseline", eventCount: 12, incomplete: false, ignore: [],
    openBreaks: { reconciliation: open, controls: 0, actions: 0 }, lastRun: null,
    ...(syncedAt ? { syncedAt } : {}), ...(syncError ? { syncError } : {}),
  };
}
const assets = [
  asset("one", "AAA", "999999999999999999999", 2, "2026-10-01T12:00:00Z"),
  asset("two", "BBB", "2", 0, "2026-10-02T12:00:00Z"),
  asset("three", "CCC", "10.5", 2, "2026-10-01T12:00:00Z"),
  asset("four", "DDD", "0.1", 0, undefined, "indexer offline"),
  asset("five", "EEE", "11", 4, "2026-10-03T12:00:00Z"),
];

describe("watched asset filtering and sorting", () => {
  it("sorts break counts stably, large exact supplies and absent timestamps", () => {
    expect(visibleAssets(assets, "", false, "breaks", "desc").map((x) => x.code)).toEqual(["EEE", "AAA", "CCC", "BBB", "DDD"]);
    expect(visibleAssets(assets, "", false, "units", "asc").map((x) => x.code)).toEqual(["DDD", "BBB", "CCC", "EEE", "AAA"]);
    expect(visibleAssets(assets, "", false, "indexed", "desc").map((x) => x.code)).toEqual(["EEE", "BBB", "AAA", "CCC", "DDD"]);
    expect(visibleAssets(assets, "asset bb", false, "breaks", "desc").map((x) => x.code)).toEqual(["BBB"]);
    expect(visibleAssets(assets, "", true, "breaks", "desc").map((x) => x.code)).toEqual(["EEE", "AAA", "CCC", "DDD"]);
  });

  it("uses keyboard-accessible sorting and retains active filters across a refresh", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Overview assets={assets} network="mainnet" onChange={vi.fn()} />);
    const column = screen.getByRole("columnheader", { name: "Open breaks" });
    expect(column).toHaveAttribute("aria-sort", "descending");
    await user.click(screen.getByRole("button", { name: "Units outstanding" }));
    expect(screen.getByRole("columnheader", { name: "Units outstanding" })).toHaveAttribute("aria-sort", "descending");
    await user.click(screen.getByRole("checkbox", { name: "Needs attention" }));
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(5);
    await user.type(screen.getByRole("textbox", { name: "Filter assets by name or code" }), "c");
    expect(screen.getByRole("link", { name: "Asset CCC" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Asset BBB" })).not.toBeInTheDocument();
    rerender(<Overview assets={assets.map((a) => ({ ...a }))} network="mainnet" onChange={vi.fn()} />);
    expect(screen.getByRole("checkbox", { name: "Needs attention" })).toBeChecked();
    expect(screen.getByRole("textbox", { name: "Filter assets by name or code" })).toHaveValue("c");
  });
});

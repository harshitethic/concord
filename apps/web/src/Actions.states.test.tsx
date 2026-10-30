import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { api, type AssetSummary } from "./api";
import { Actions } from "./tabs/Actions";

vi.mock("./api", () => ({ api: vi.fn() }));
const asset = { id: "asset-one", code: "UNIT", network: "testnet" } as unknown as AssetSummary;
const result = {
  warnings: [], breaks: [], lines: [], reconciledThrough: "2026-10-02T00:00:00Z",
  flowAsset: { code: "UNIT" }, summary: { expectedTotal: "0", observedTotal: "0", difference: "0" },
};

describe("corporate action detail states", () => {
  it.each(["scheduled", "pending", "clean", "breaks"] as const)("renders meaningful %s state", async (state) => {
    vi.mocked(api).mockResolvedValue([{
      id: 1, label: "October action", type: "split",
      recordTime: "2026-10-01T12:00:00Z", state, openBreaks: 0,
      result: state === "clean" || state === "breaks" ? result : null,
    }]);
    render(<Actions asset={asset} assets={[asset]} onChange={vi.fn()} />);
    await screen.findByRole("button", { name: "October action" });
    if (state === "pending") expect(screen.getByText(/Reconciling this action/)).toBeInTheDocument();
    if (state === "scheduled") expect(screen.getByText(/has not reached the record time yet/)).toBeInTheDocument();
    if (state === "clean" || state === "breaks") {
      expect(screen.getByText("Nobody held units at the record time, so nothing was due.")).toBeInTheDocument();
      const tables = screen.getAllByRole("table");
      expect(tables).toHaveLength(1);
      expect(within(tables[0]!).getByRole("columnheader", { name: "Action" })).toBeInTheDocument();
    }
  });
});

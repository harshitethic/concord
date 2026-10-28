import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActionTerms } from "./tabs/Actions";
import type { Action, AssetSummary } from "./api";
const asset = { id: "asset-1", code: "BENJI" } as AssetSummary;
function action(type: Action["type"], params: Record<string, unknown>): Action {
  return { id: 1, type, label: "Test", params, recordTime: "2026-10-01T00:00:00Z", state: "scheduled", reconciledAt: null,
    snapshot: null, result: null, openBreaks: 0 };
}

describe("action terms", () => {
  it("shows dividend terms with paying agent and exclusions as addresses", () => {
    render(<ActionTerms asset={asset} action={action("dividend", {
      ratePerUnit: "0.25", payAsset: "asset-1", payer: "GABCPAYER", rounding: "half-up",
      windowTo: "2026-10-02T00:00:00Z", exclude: ["GABCEXCLUDED"], unknownSecret: "DO NOT SHOW",
    })} />);
    const terms = screen.getByRole("region", { name: "Action terms" });
    expect(within(terms).getByText("0.25")).toBeInTheDocument();
    expect(within(terms).getByText("BENJI")).toBeInTheDocument();
    expect(within(terms).getByText("half-up")).toBeInTheDocument();
    expect(within(terms).getByText("Paying agent")).toBeInTheDocument();
    expect(within(terms).getByText("Excluded addresses")).toBeInTheDocument();
    expect(within(terms).queryByText("DO NOT SHOW")).not.toBeInTheDocument();
    expect(within(terms).queryByText("Split ratio")).not.toBeInTheDocument();
  });
  it("shows ratio only for a split and redemption", () => {
    const { rerender } = render(<ActionTerms asset={asset} action={action("split", { num: "3", den: "2", ratePerUnit: "HIDDEN" })} />);
    expect(screen.getByText("Split ratio")).toBeInTheDocument();
    expect(screen.getByText("3 / 2")).toBeInTheDocument();
    expect(screen.queryByText("HIDDEN")).not.toBeInTheDocument();
    rerender(<ActionTerms asset={asset} action={action("redemption", { num: "1", den: "4", exclude: [false, null] })} />);
    expect(screen.getByText("Redemption ratio")).toBeInTheDocument();
    expect(screen.queryByText("Excluded addresses")).not.toBeInTheDocument();
  });
});

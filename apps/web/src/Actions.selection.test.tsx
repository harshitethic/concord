import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, type AssetSummary } from "./api";
import { Actions } from "./tabs/Actions";

vi.mock("./api", () => ({ api: vi.fn() }));
const asset = { id: "asset-one", code: "UNIT", network: "testnet" } as unknown as AssetSummary;
const entries = [
  { id: 1, label: "Alpha", type: "split", recordTime: "2026-10-01T12:00:00Z", state: "scheduled", openBreaks: 0, result: null },
  { id: 2, label: "Beta", type: "split", recordTime: "2026-10-02T12:00:00Z", state: "scheduled", openBreaks: 0, result: null },
];
beforeEach(() => vi.mocked(api).mockReset());

describe("corporate action selection accessibility", () => {
  it("uses a single keyboard-operable button and marks only the selected row current", async () => {
    vi.mocked(api).mockResolvedValue(entries);
    const user = userEvent.setup();
    render(<Actions asset={asset} assets={[asset]} onChange={vi.fn()} />);
    const alpha = await screen.findByRole("button", { name: "Alpha" });
    const beta = screen.getByRole("button", { name: "Beta" });
    expect(alpha.closest("tr")).toHaveAttribute("aria-current", "true");
    expect(beta.closest("tr")).not.toHaveAttribute("aria-current");
    await user.click(beta);
    await waitFor(() => expect(beta.closest("tr")).toHaveAttribute("aria-current", "true"));
    expect(alpha.closest("tr")).not.toHaveAttribute("aria-current");
    alpha.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(alpha.closest("tr")).toHaveAttribute("aria-current", "true"));
    expect(beta.closest("tr")).not.toHaveAttribute("aria-current");
  });
});

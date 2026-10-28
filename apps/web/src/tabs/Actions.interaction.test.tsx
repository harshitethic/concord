import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Actions } from "./Actions";
import type { AssetSummary } from "../api";
const asset = { id: "asset", network: "mainnet", code: "AAA", state: "ready" } as AssetSummary;
vi.mock("../api", async (importOriginal) => {
  const real = await importOriginal<typeof import("../api")>();
  return { ...real, api: vi.fn().mockResolvedValue([
    { id: 1, label: "Alpha action", type: "dividend", recordTime: "2026-10-01T00:00:00Z", state: "scheduled", params: {}, snapshot: null, result: null, openBreaks: 0 },
    { id: 2, label: "Beta action", type: "split", recordTime: "2026-10-02T00:00:00Z", state: "scheduled", params: {}, snapshot: null, result: null, openBreaks: 0 },
  ]) };
});
describe("corporate action list keyboard selection", () => {
  it("uses exactly one focusable button per action and annotates the selected row", async () => {
    const user = userEvent.setup();
    render(<Actions asset={asset} assets={[asset]} onChange={vi.fn()} />);
    const alpha = await screen.findByRole("button", { name: "Alpha action" });
    const beta = screen.getByRole("button", { name: "Beta action" });
    expect(alpha.closest("tr")).toHaveAttribute("aria-current", "true");
    expect(beta.closest("tr")).not.toHaveAttribute("aria-current");
    beta.focus();
    await user.keyboard("{Enter}");
    expect(beta.closest("tr")).toHaveAttribute("aria-current", "true");
    expect(alpha.closest("tr")).not.toHaveAttribute("aria-current");
    expect(within(beta.closest("tr")!).getByRole("button", { name: "Beta action" })).toBe(beta);
  });
});

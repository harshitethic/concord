import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Holdings } from "./tabs/Holdings";
import { api, type AssetSummary, type Holdings as HoldingsData } from "./api";
vi.mock("./api", async (importOriginal) => ({ ...(await importOriginal<typeof import("./api")>()), api: vi.fn() }));
const asset = { id:"a", state:"ready", code:"AAA", syncedLedger:40 } as AssetSummary;
const data: HoldingsData = { asOf:"2026-10-01T00:00:00Z", ledger:40, supply:"100", holderCount:0, incomplete:[], holders:[] };
describe("stale holdings presentation", () => {
  it("marks previous figures as busy and shows a warning during as-of refresh", async () => {
    let rejectNext: ((reason: Error) => void) | undefined;
    vi.mocked(api).mockReset().mockResolvedValueOnce(data).mockImplementationOnce(() => new Promise((_,reject)=>{rejectNext=reject;}));
    render(<Holdings asset={asset} />);
    expect(await screen.findByText("No holders at this time")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/As of/), {target:{value:"2026-10-02T12:00"}});
    expect(await screen.findByRole("status")).toHaveTextContent(/Previous figures/);
    expect(screen.getByText("No holders at this time").closest("[aria-busy]")).toHaveAttribute("aria-busy", "true");
    rejectNext!(new Error("offline"));
    await waitFor(()=>expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent(/Showing previously loaded holdings/);
    expect(screen.getByText("No holders at this time")).toBeInTheDocument();
  });
});

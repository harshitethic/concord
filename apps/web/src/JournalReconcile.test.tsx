import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Imports, importJournalAndMaybeReconcile } from "./tabs/Reconciliation";
import type { AssetSummary } from "./api";

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const asset = { id: "asset-one", code: "BENJI" } as AssetSummary;

describe("journal import with optional reconciliation", () => {
  it("defaults to rerun only when a previous reconciliation exists", () => {
    const { rerender } = render(<Imports asset={asset} hasRuns onDone={vi.fn()} />);
    expect(screen.getByRole("checkbox", { name: "Re-run reconciliation after importing the journal" })).toBeChecked();
    rerender(<Imports asset={asset} hasRuns={false} onDone={vi.fn()} />);
    expect(screen.queryByRole("checkbox", { name: "Re-run reconciliation after importing the journal" })).not.toBeInTheDocument();
  });

  it("imports first, then reruns and returns the new run id", async () => {
    const requests: string[] = [];
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string) => {
      requests.push(url);
      return Response.json(url.endsWith("/journal") ? { entries: 2, issues: [] } : { id: 44 });
    }));
    const result = await importJournalAndMaybeReconcile("asset-one", "ref,date", true);
    expect(requests).toEqual(["/api/assets/asset-one/journal", "/api/assets/asset-one/reconciliations"]);
    expect(result).toMatchObject({ journal: { entries: 2 }, run: { id: 44 } });
  });

  it("preserves the successful import when the second request fails, and skips an optional rerun", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ entries: 2, issues: [] }))
      .mockResolvedValueOnce(Response.json({ error: "Too many runs" }, { status: 429 }))
      .mockResolvedValueOnce(Response.json({ entries: 3, issues: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const failed = await importJournalAndMaybeReconcile("asset-one", "csv", true);
    expect(failed).toMatchObject({ journal: { entries: 2 }, rerunError: "Too many runs" });
    const skipped = await importJournalAndMaybeReconcile("asset-one", "csv", false);
    expect(skipped).toMatchObject({ journal: { entries: 3 } });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

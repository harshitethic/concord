import { describe, expect, it, vi } from "vitest";
import { csvCell, serializeHoldingsCsv, downloadHoldingsCsv } from "./csv";

describe("holdings CSV export", () => {
  it("quotes commas, quotes and newlines and prevents spreadsheet formula execution", () => {
    expect(csvCell('Alice, "Team"\r\nB')).toBe('"Alice, ""Team""\r\nB"');
    for (const prefix of ["=", "+", "-", "@", "  ="]) {
      expect(csvCell(`${prefix}SUM(1,1)`)).toBe(`"'${prefix}SUM(1,1)"`);
    }
  });
  it("serializes the visible rows in order with exact status and percentage", () => {
    const text = serializeHoldingsCsv([
      { address: "GA,TEST", units: "12.34", share: 12.345, status: null, ignored: false },
      { address: "=HYPERLINK(1)", units: "-0.50", share: 0, status: "frozen", ignored: true },
    ]);
    expect(text).toBe(`"Address","Units","Share","Status","Off register"\r\n"GA,TEST","12.34","12.35%","Not seen","No"\r\n"'=HYPERLINK(1)","'-0.50","0.00%","frozen","Yes"\r\n`);
  });
  it("uses an as-of instant in the downloaded file name and revokes its URL", () => {
    const createUrl = vi.fn().mockReturnValue("blob:holdings");
    const revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: createUrl, revokeObjectURL: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const append = vi.spyOn(document.body, "appendChild");
    const timeout = vi.spyOn(globalThis, "setTimeout").mockImplementation((callback) => { (callback as () => void)(); return 0 as unknown as ReturnType<typeof setTimeout>; });
    try {
      downloadHoldingsCsv([], "2026-10-06T21:00:00.000Z", "BENJI");
      expect(click).toHaveBeenCalledOnce();
      const anchor = append.mock.calls.find(([node]) => node instanceof HTMLAnchorElement)![0] as HTMLAnchorElement;
      expect(anchor.download).toBe("BENJI-holdings-2026-10-06T21-00-00-000Z.csv");
      expect(createUrl).toHaveBeenCalledOnce();
      expect(revoke).toHaveBeenCalledWith("blob:holdings");
    } finally {
      click.mockRestore(); append.mockRestore(); timeout.mockRestore(); vi.unstubAllGlobals();
    }
  });
});

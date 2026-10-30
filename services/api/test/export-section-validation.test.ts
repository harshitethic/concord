import { describe, expect, it, vi } from "vitest";
import { Concord, Invalid } from "../src/concord.js";

describe("CSV export section guard", () => {
  it("rejects an unknown section without reading the DB or constructing an audit pack", () => {
    const auditExport = vi.fn(() => { throw new Error("DB must not be read"); });
    const service = { auditExport } as unknown as Concord;
    for (const input of ["", "typo", "HOLDINGS", "__proto__", "events,csv"]) {
      expect(() => Concord.prototype.exportCsv.call(service, "FUND", input)).toThrow(Invalid);
      expect(() => Concord.prototype.exportCsv.call(service, "FUND", input)).toThrow(
        "section must be holdings, events, controls or breaks",
      );
    }
    expect(auditExport).not.toHaveBeenCalled();
  });

  it("allows supported sections to reach the audit pack", () => {
    const auditExport = vi.fn(() => { throw new Error("Reached audit export"); });
    const service = { auditExport } as unknown as Concord;
    for (const section of ["holdings", "events", "controls", "breaks"]) {
      expect(() => Concord.prototype.exportCsv.call(service, "FUND", section)).toThrow("Reached audit export");
    }
    expect(auditExport).toHaveBeenCalledTimes(4);
  });
});

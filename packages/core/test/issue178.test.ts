import { describe, expect, it } from "vitest";
import { parseRegisterCsv } from "../src/register.js";
const lots = "holder_id,account,units\nH1,GA,1\nH1,GA,2.5\nH2,GB,4";
describe("duplicate-holder import policy", () => {
  it("rejects duplicate holder IDs by default with a row-specific issue", () => {
    const out = parseRegisterCsv(lots);
    expect(out.positions).toHaveLength(2);
    expect(out.positions[0]?.units).toBe(10000000n);
    expect(out.issues).toEqual([{ line: 3, message: "duplicate holder_id H1" }]);
  });
  it("sums lot-level units precisely and reports merged rows", () => {
    const out = parseRegisterCsv(lots, 7, { duplicates: "sum" });
    expect(out.issues).toEqual([]);
    expect(out.positions.map((x) => x.units)).toEqual([35000000n, 40000000n]);
    expect(out.merged).toEqual([{ holderId: "H1", line: 3, policy: "sum" }]);
    const huge = parseRegisterCsv("holder_id,units\nH,9999999999999\nH,1", 7, { duplicates: "sum" });
    expect(huge.positions[0]?.units).toBe(100000000000000000000n);
  });
  it("replaces a repeated holder when explicitly requested", () => {
    const out = parseRegisterCsv(lots, 7, { duplicates: "last" });
    expect(out.positions[0]?.units).toBe(25000000n);
    expect(out.merged).toEqual([{ holderId: "H1", line: 3, policy: "last" }]);
  });
  it("rejects conflicting account mappings instead of corrupting a summed position", () => {
    const out = parseRegisterCsv("holder_id,account,units\nH1,GA,1\nH1,GB,2", 7, { duplicates: "sum" });
    expect(out.positions[0]?.units).toBe(10000000n);
    expect(out.issues[0]?.message).toContain("conflicting account");
  });
});

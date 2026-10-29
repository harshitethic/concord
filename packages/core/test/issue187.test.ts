import { describe, expect, it } from "vitest";
import { toCsv, parseCsv } from "../src/csv.js";
describe("per-column CSV export formatting", () => {
  it("renames headers, formats raw values and quotes computed strings", () => {
    const csv = toCsv([
      { key: "id", header: "Holder ID" },
      { key: "units", header: "Units Outstanding", format: (v) => String(v) + " shares" },
      { key: "memo", format: (v) => String(v).toUpperCase() },
    ], [{ id: "A", units: 3n, memo: 'x, "hello"' }]);
    expect(parseCsv(csv)).toEqual([
      ["Holder ID", "Units Outstanding", "memo"],
      ["A", "3 shares", 'X, "HELLO"'],
    ]);
  });
  it("leaves old-style headers and bytes unchanged", () => {
    expect(toCsv(["a","b"], [{ a: 2, b: "x,y" }])).toBe('a,b\n2,"x,y"\n');
  });
  it("rejects unsafe object and nonfinite formatter output", () => {
    expect(() => toCsv([{ key: "v", format: () => ({oops: true}) }], [{ v: 1 }])).toThrow(/cannot export object/);
    expect(() => toCsv([{ key: "v", format: () => Infinity }], [{ v: 1 }])).toThrow(/non-finite/);
  });
});

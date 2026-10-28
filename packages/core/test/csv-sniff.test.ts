import { describe, expect, it } from "vitest";
import { detectCsvDelimiter, parseCsv, parseCsvTable, toCsv } from "../src/csv.js";

describe("CSV delimiter sniffing", () => {
  it("handles comma, semicolon, tab and pipe, including quoted commas", () => {
    for (const delimiter of [",", ";", "\t", "|"]) {
      const text = ['holder_id', 'units', 'name'].join(delimiter) + "\n" +
        ['abc', '12', '"Alice, Smith"'].join(delimiter) + "\n";
      expect(parseCsv(text)).toEqual([["holder_id", "units", "name"], ["abc", "12", "Alice, Smith"]]);
      expect(detectCsvDelimiter(text)).toBe(delimiter);
    }
  });
  it("falls back to comma on ambiguous or single-column headers", () => {
    expect(detectCsvDelimiter("id;units,name\n1;2,3")).toBe(",");
    expect(detectCsvDelimiter("only-one-header\nhi")).toBe(",");
    expect(parseCsvTable("\uFEFFholder_id;units\nA;2").headers).toEqual(["holder_id", "units"]);
  });
  it("keeps writer/parser roundtrips for fields containing alternate separators", () => {
    const data = toCsv(["info"], [{ info: "a;b|c\td" }]);
    expect(parseCsv(data)).toEqual([["info"], ["a;b|c\td"]]);
  });
});

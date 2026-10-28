import { describe, expect, it } from "vitest";
import { parseCsv, parseCsvTable, CSV_DEFAULT_MAX_BYTES, CSV_DEFAULT_MAX_ROWS } from "../src/csv.js";
describe("CSV resource guards", () => {
  it("enforces row caps before building an unbounded table", () => {
    expect(() => parseCsvTable("a,b\n1,2\n3,4", { maxRows: 2 })).toThrow("file has more than 2 rows");
    expect(parseCsv("a,b\n1,2", { maxRows: 2 })).toHaveLength(2);
  });
  it("enforces UTF-8 byte limits rather than character counts", () => {
    expect(() => parseCsv("name\nÉlodie", { maxBytes: 11 })).toThrow(/more than 11 bytes/);
    expect(parseCsv("name\nÉlodie", { maxBytes: 12 })).toHaveLength(2);
  });
  it("documents safe defaults and rejects invalid custom caps", () => {
    expect(CSV_DEFAULT_MAX_ROWS).toBe(100000);
    expect(CSV_DEFAULT_MAX_BYTES).toBe(10 * 1024 * 1024);
    expect(() => parseCsv("a", { maxRows: 0 })).toThrow(/positive integers/);
    expect(() => parseCsv("a", { maxBytes: -1 })).toThrow(/positive integers/);
  });
});

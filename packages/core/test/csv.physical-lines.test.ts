import { describe, expect, it } from "vitest";
import { parseCsv, parseCsvTable } from "../src/csv.js";

describe("CSV physical row line numbers", () => {
  it("preserves actual starting lines after blank lines", () => {
    const table = parseCsvTable("holder_id,units\n\nA,1\n\nB,2\n");
    expect(table.records.map((row) => row.line)).toEqual([3, 5]);
    expect(parseCsv("a\n\n1\n\n2")).toEqual([["a"], ["1"], ["2"]]);
  });
  it("counts quoted multiline fields and CRLF as one physical newline", () => {
    const table = parseCsvTable('name,units\r\n"First\r\nSecond",1\r\nB,2\r\n');
    expect(table.records.map((row) => row.line)).toEqual([2, 4]);
    expect(table.records[0]!.values.name).toContain("First\r\nSecond");
  });
  it("counts a lone CR separator correctly", () => {
    expect(parseCsvTable("h,u\rA,1\r\rB,2").records.map((r) => r.line)).toEqual([2, 4]);
  });
});

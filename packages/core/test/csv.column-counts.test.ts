import { describe, expect, it } from "vitest";
import { parseCsvTable } from "../src/csv.js";
import { parseRegisterCsv } from "../src/register.js";
import { parseJournalCsv } from "../src/movements.js";
import { parseInstructionsCsv } from "../src/controls.js";

describe("CSV row column mismatches", () => {
  it("retains the actual cell count even when values are padded", () => {
    const table = parseCsvTable("holder_id,units,account\nA,1\nB,2,\nC,3,A,EXTRA\n");
    expect(table.records.map((record) => record.cells)).toEqual([2, 3, 4]);
    expect(table.records[1]!.values.account).toBe("");
  });
  it("reports truncated registers instead of parsing a padded row", () => {
    const result = parseRegisterCsv("holder_id,units,account\nH1,1\nH2,2,\n");
    expect(result.issues).toEqual([{ line: 2, message: "expected 3 cells, found 2" }]);
    expect(result.positions).toHaveLength(1);
  });
  it("rejects extra journal cells and missing instruction cells", () => {
    expect(parseJournalCsv("ref,date,type,units\nJ1,2026-01-01,issue,1,EXTRA\n").issues).toEqual([
      { line: 2, message: "expected 4 cells, found 5" },
    ]);
    expect(parseInstructionsCsv("ref,type,account,issued_at\nI1,freeze,A\n").issues).toEqual([
      { line: 2, message: "expected 4 cells, found 3" },
    ]);
  });
});

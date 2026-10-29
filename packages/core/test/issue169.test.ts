import { describe, expect, it } from "vitest";
import { parseCsv, parseCsvTable } from "../src/csv.js";
import { parseRegisterCsv } from "../src/register.js";
import { parseJournalCsv } from "../src/movements.js";
import { parseInstructionsCsv } from "../src/controls.js";
describe("explicit CSV delimiters", () => {
  it("parses quoted semicolon and tab-separated fields", () => {
    expect(parseCsv('"a;b";two\n"c;d";three', { delimiter: ";" })).toEqual([["a;b", "two"], ["c;d", "three"]]);
    expect(parseCsv('"a"\tb\n', { delimiter: "\t" })).toEqual([["a","b"]]);
    expect(parseCsvTable("A;B\nx;y", { delimiter: ";" }).headers).toEqual(["a","b"]);
  });
  it("threads options through all three record parsers", () => {
    const reg = parseRegisterCsv("holder_id;units\nH1;7", 7, { delimiter: ";" });
    expect(reg.issues).toEqual([]);
    expect(reg.positions[0]?.units).toBe(70000000n);
    const j = parseJournalCsv("ref\tdate\ttype\tto_account\tunits\nJ1\t2026-10-01\tissue\tGB\t3", 7, { delimiter: "\t" });
    expect(j.issues).toEqual([]);
    expect(j.entries[0]?.units).toBe(30000000n);
    const i = parseInstructionsCsv("ref;type;account;issued_at\nI1;freeze;GB;2026-10-01T00:00:00Z", 7, { delimiter: ";" });
    expect(i.issues).toEqual([]);
    expect(i.instructions[0]?.type).toBe("freeze");
  });
  it("defaults to comma for existing callers", () => {
    expect(parseCsv("a;b")).toEqual([["a;b"]]);
    expect(parseRegisterCsv("holder_id,units\nH1,2").positions[0]?.holderId).toBe("H1");
  });
});

import { describe, expect, it } from "vitest";
import { parseUnits, safeParseUnits } from "../src/amount.js";
import { parseRegisterCsv } from "../src/register.js";
import { parseJournalCsv } from "../src/movements.js";
import { parseInstructionsCsv } from "../src/controls.js";

describe("safeParseUnits", () => {
  it("returns the same exact BigInt for a valid decimal", () => {
    expect(safeParseUnits("1,234.567")).toEqual({ ok: true, value: parseUnits("1,234.567") });
  });
  it("returns stable machine-readable error codes with the original message", () => {
    expect(safeParseUnits("12abc")).toMatchObject({ ok: false, code: "INVALID_DECIMAL", message: expect.stringContaining("not a decimal") });
    expect(safeParseUnits("1.234", 2)).toMatchObject({ ok: false, code: "PRECISION_EXCEEDED", message: expect.stringContaining("more than 2") });
    expect(safeParseUnits("2", -1)).toMatchObject({ ok: false, code: "INVALID_DECIMALS" });
  });
  it("is used by register, journal and instruction imports without hiding row-specific errors", () => {
    const register = parseRegisterCsv("holder_id,units\nA,invalid");
    expect(register.issues).toHaveLength(1);
    expect(register.issues[0]?.message).toContain("not a decimal");
    const journal = parseJournalCsv("ref,date,type,units\nJ1,2026-10-01,transfer,invalid");
    expect(journal.issues).toHaveLength(1);
    expect(journal.issues[0]?.message).toContain("not a decimal");
    const instructions = parseInstructionsCsv("ref,type,account,issued_at,units\nI1,clawback,GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,2026-10-01T12:00:00Z,invalid");
    expect(instructions.issues).toHaveLength(1);
    expect(instructions.issues[0]?.message).toContain("not a decimal");
  });
});

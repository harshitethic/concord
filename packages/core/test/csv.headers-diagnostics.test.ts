import { describe, expect, it } from "vitest";
import { parseRegisterCsv } from "../src/register.js";
import { parseJournalCsv } from "../src/movements.js";
import { parseInstructionsCsv } from "../src/controls.js";

describe("missing required CSV column diagnostics", () => {
  it("reports normalised headers and accepted aliases in registers", () => {
    expect(() => parseRegisterCsv("Name,Qty\nAlice,5")).toThrow(
      /found: name, qty; accepted holder aliases: holder_id, holder, investor_id, account_id, id; accepted unit aliases:/,
    );
  });
  it("reports found and accepted fields in journals", () => {
    expect(() => parseJournalCsv("Reference,Date,Type,Qty\nJ1,2026-10-20,issue,1")).toThrow(
      /found: reference, date, type, qty; accepted: ref, date, type, from_account, to_account, units, tx_hash/,
    );
  });
  it("reports found and accepted fields in instructions", () => {
    expect(() => parseInstructionsCsv("Ref,Type,Addr,Time\nI1,freeze,A,2026-10-20")).toThrow(
      /found: ref, type, addr, time; accepted: ref, type, account, units, issued_at/,
    );
  });
});

import { describe, expect, it } from "vitest";
import { parseRegisterCsv } from "../src/register.js";
import { parseJournalCsv } from "../src/movements.js";
import { parseInstructionsCsv } from "../src/controls.js";

describe("helpful accepted values in CSV parse issues", () => {
  it("names allowed holder statuses without accepting unknown values", () => {
    const result = parseRegisterCsv("holder_id,units,status\nH1,1,pending\n");
    expect(result.positions).toHaveLength(0);
    expect(result.issues[0]?.message).toContain('unknown status "pending"; accepted: active, authorized');
  });
  it("names journal entry type aliases", () => {
    const result = parseJournalCsv("ref,date,type,units\nJ1,2026-10-20,Redeemed,1\n");
    expect(result.entries).toHaveLength(0);
    expect(result.issues[0]?.message).toMatch(/accepted: issue, issuance, subscription, mint, transfer, redeem/);
  });
  it("accepts British authorised and explains unsupported control types", () => {
    const r = parseInstructionsCsv("ref,type,account,issued_at\nI1,authorised,A,2026-10-20T12:00:00Z\n");
    expect(r.issues).toEqual([]);
    expect(r.instructions[0]!.type).toBe("authorize");
    const bad = parseInstructionsCsv("ref,type,account,issued_at\nI2,unrecognised,A,2026-10-20T12:00:00Z\n");
    expect(bad.issues[0]?.message).toContain("accepted: authorize, authorise, authorised, freeze, unfreeze, clawback");
  });
});

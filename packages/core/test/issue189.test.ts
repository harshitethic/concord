import { describe, expect, it } from "vitest";
import { parseJournalCsv } from "../src/movements.js";
describe("transfer-agent journal header synonyms", () => {
  it("accepts trade_date, transaction_type, quantity, reference and hash", () => {
    const csv = "reference,trade_date,transaction_type,quantity,recipient,hash\nJ1,2026-10-01,subscription,2,GB,ABC123";
    const out = parseJournalCsv(csv);
    expect(out.issues).toEqual([]);
    expect(out.entries[0]).toMatchObject({ ref: "J1", date: "2026-10-01", type: "issue", units: 20000000n, to: "GB", txHash: "abc123" });
  });
  it("prefers a populated canonical field and falls back when it is blank", () => {
    const csv = "ref,date,trade_date,type,from_account,from,to_account,to,units,shares\n" +
      "J1,,2026-10-03,transfer,,GA,,GB,,5\n" +
      "J2,2026-10-04,2026-10-05,transfer,GC,GA,GD,GB,3,7";
    const out = parseJournalCsv(csv);
    expect(out.issues).toEqual([]);
    expect(out.entries[0]).toMatchObject({ date: "2026-10-03", from: "GA", to: "GB", units: 50000000n });
    expect(out.entries[1]).toMatchObject({ date: "2026-10-04", from: "GC", to: "GD", units: 30000000n });
  });
  it("lists known alternatives when a column is missing", () => {
    expect(() => parseJournalCsv("ref,date,type\nJ1,2026-10-01,issue")).toThrow(/quantity, shares, amount/);
  });
});

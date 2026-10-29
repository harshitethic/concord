import { describe, expect, it } from "vitest";
import { parseJournalCsv } from "../src/movements.js";
describe("journal memo retention", () => {
  it("preserves the narrative for audit trails", () => {
    const out = parseJournalCsv('ref,date,type,to_account,units,memo\nJ1,2026-10-01,issue,GB,2,"Subscription – Fund A"');
    expect(out.issues).toEqual([]);
    expect(out.entries[0]?.memo).toBe("Subscription – Fund A");
  });
  it("supports note and description columns", () => {
    expect(parseJournalCsv("ref,date,type,to_account,units,note\nJ2,2026-10-01,issue,GB,1,Hello").entries[0]?.memo).toBe("Hello");
    expect(parseJournalCsv("ref,date,type,to_account,units,description\nJ3,2026-10-01,issue,GB,1,Other").entries[0]?.memo).toBe("Other");
  });
  it("reports an overlength memo as an issue without silently truncating", () => {
    const out = parseJournalCsv("ref,date,type,to_account,units,memo\nJ4,2026-10-01,issue,GB,1," + "a".repeat(501));
    expect(out.entries).toEqual([]);
    expect(out.issues).toEqual([{ line: 2, message: "journal memo exceeds 500 characters" }]);
  });
});

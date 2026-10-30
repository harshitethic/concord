import { describe, expect, it } from "vitest";
import { parseRegisterCsv } from "../src/register.js";

describe("bounded register CSV issue diagnostics", () => {
  it("retains all details for small files", () => {
    const result = parseRegisterCsv("holder_id,units\nH1,no\nH2,2\nH3,bad\n");
    expect(result.positions).toHaveLength(1);
    expect(result.issues).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.truncated).toBe(false);
  });

  it("limits very large bad imports and reports their real count", () => {
    const rows = Array.from({ length: 12000 }, (_, i) => `H${i},bad`);
    const parsed = parseRegisterCsv("holder_id,units\n" + ["VALID,1", ...rows].join("\n") + "\n");
    expect(parsed.positions).toHaveLength(1);
    expect(parsed.issues).toHaveLength(200);
    expect(parsed.total).toBe(12000);
    expect(parsed.truncated).toBe(true);
    expect(parsed.issues[0]).toMatchObject({ line: 3 });
    expect(parsed.issues.at(-1)?.message).toBe("11801 additional invalid rows omitted (12000 total).");
  });
});

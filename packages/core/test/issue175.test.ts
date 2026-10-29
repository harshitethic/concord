import { describe, expect, it } from "vitest";
import { normalizeCsvHeader, parseCsvTable } from "../src/csv.js";
import { parseRegisterCsv } from "../src/register.js";
describe("localized and annotated CSV header names", () => {
  it("handles parenthesized units, punctuation, accents and repeated separators", () => {
    expect(normalizeCsvHeader("Units (shares)")).toBe("units");
    expect(normalizeCsvHeader("Holder.ID")).toBe("holder_id");
    expect(normalizeCsvHeader("Küche – Name")).toBe("küche_name");
    expect(normalizeCsvHeader("_A...B_")).toBe("a_b");
    expect(normalizeCsvHeader("__proto__")).toBe("__proto__");
  });
  it("allows real annotated register exports without manual CSV edits", () => {
    const result = parseRegisterCsv("Holder.ID,Units (shares)\nH1,2.5");
    expect(result.issues).toEqual([]);
    expect(result.positions[0]).toMatchObject({ holderId: "H1", units: 25000000n });
  });
  it("rejects collisions caused by the normalization", () => {
    expect(() => parseCsvTable("Units,Units (shares)\n1,2")).toThrow(/duplicate column/);
  });
});

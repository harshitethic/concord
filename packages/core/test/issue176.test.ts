import { describe, expect, it } from "vitest";
import { parseRegisterCsv } from "../src/register.js";
describe("custom transfer agent column aliases", () => {
  it("parses unusual vendor field names", () => {
    const parsed = parseRegisterCsv("Beneficial Owner Ref,Position\nH1,3.25", 7, {
      aliases: { holder_id: ["Beneficial Owner Ref"], units: ["Position"] },
    });
    expect(parsed.issues).toEqual([]);
    expect(parsed.positions[0]).toMatchObject({ holderId: "H1", units: 32500000n });
  });
  it("prefers custom names but retains default aliases as fallback", () => {
    expect(parseRegisterCsv("holder_id,units,position\nH1,1,5", 7, {
      aliases: { units: ["position"] },
    }).positions[0]?.units).toBe(50000000n);
    expect(parseRegisterCsv("holder_id,units\nH1,1", 7, { aliases: { units: ["position"] } }).issues).toEqual([]);
  });
  it("rejects unknown canonical fields and invalid values", () => {
    expect(() => parseRegisterCsv("holder_id,units\nH1,1", 7, {
      aliases: { unrecognized: ["x"] } as never,
    })).toThrow(/unknown register column/);
    expect(() => parseRegisterCsv("holder_id,units\nH1,1", 7, {
      aliases: { units: [""] },
    })).toThrow(/non-empty strings/);
  });
});

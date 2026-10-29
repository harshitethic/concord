import { describe, expect, it } from "vitest";
import { parseRegisterCsv } from "../src/register.js";
describe("register status synonyms", () => {
  it("maps custom status words and Y/N strings case-insensitively", () => {
    const csv = "holder_id,units,status\nH1,1,Dormant\nH2,2,Y\nH3,3,Locked\nH4,4,N";
    const out = parseRegisterCsv(csv, 7, { statusMap: {
      dormant: "frozen", y: "active", locked: "frozen", n: "frozen",
    } });
    expect(out.issues).toEqual([]);
    expect(out.positions.map((x) => x.status)).toEqual(["frozen","active","frozen","frozen"]);
  });
  it("keeps built-in words and allows explicit overrides", () => {
    expect(parseRegisterCsv("holder_id,units,status\nH1,1,authorized").positions[0]?.status).toBe("active");
    expect(parseRegisterCsv("holder_id,units,status\nH1,1,active", 7, {
      statusMap: { active: "frozen" },
    }).positions[0]?.status).toBe("frozen");
  });
  it("offers accepted values on invalid input", () => {
    const out = parseRegisterCsv("holder_id,units,status\nH1,1,unknown", 7, {
      statusMap: { dormant: "frozen" },
    });
    expect(out.issues[0]?.message).toContain("accepted:");
    expect(out.issues[0]?.message).toContain("dormant");
  });
  it("rejects values outside active/frozen", () => {
    const out = parseRegisterCsv("holder_id,units,status\nH1,1,Dormant", 7, {
      statusMap: { dormant: "pending" as never },
    });
    expect(out.issues[0]?.message).toContain("invalid status mapping");
  });
});

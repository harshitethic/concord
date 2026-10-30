import { describe, expect, it } from "vitest";
import { parseRegisterCsv } from "../src/register.js";

describe("register holder identity validation", () => {
  it.each(["H\u0000BAD", "H\u007fBAD", "H\u0001BAD"])("rejects holder ids containing control bytes", (id) => {
    const { positions, issues } = parseRegisterCsv('holder_id,holder_name,units\n"' + id + '",Alice,1\n');
    expect(positions).toEqual([]);
    expect(issues).toHaveLength(1);
    expect(issues[0]!.message).toContain("holder_id contains control characters");
  });
  it("rejects overlong ids and holder names as ParseIssues", () => {
    const ids = parseRegisterCsv("holder_id,holder_name,units\n" + "A".repeat(201) + ",Alice,1\n");
    expect(ids.positions).toEqual([]);
    expect(ids.issues[0]?.message).toBe("holder_id exceeds 200 characters");
    const names = parseRegisterCsv("holder_id,holder_name,units\nH1," + "A".repeat(201) + ",1\n");
    expect(names.positions).toEqual([]);
    expect(names.issues[0]?.message).toBe("holder_name exceeds 200 characters");
  });
  it("allows Unicode holder IDs and names within the limit", () => {
    const { positions, issues } = parseRegisterCsv("holder_id,holder_name,units\n帳戶-001,Łukasz Žižka,1\n");
    expect(issues).toEqual([]);
    expect(positions).toMatchObject([{ holderId: "帳戶-001", holderName: "Łukasz Žižka" }]);
  });
});

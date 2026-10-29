import { describe, expect, it } from "vitest";
import { diffRegisters, type RegisterPosition } from "../src/register.js";
const holder = (id: string, units: bigint, account?: string, status?: "active" | "frozen"): RegisterPosition =>
  ({ holderId: id, units, ...(account ? { account } : {}), ...(status ? { status } : {}) });
describe("pure register changes between imports", () => {
  it("reports no changes for identical sets in any order", () => {
    const a = [holder("H2",4n),holder("H1",1n,"GA")];
    expect(diffRegisters(a,[...a].reverse())).toEqual({ added: [], removed: [], changed: [] });
  });
  it("reports added, removed and individually changed units/account/status", () => {
    const before = [holder("H1",3n,"GA","active"),holder("H2",1n,"GB")];
    const after = [holder("H1",5n,"GC","frozen"),holder("H3",7n,"GD")];
    const diff = diffRegisters(before,after);
    expect(diff.added).toEqual([after[1]]);
    expect(diff.removed).toEqual([before[1]]);
    expect(diff.changed).toEqual([{ holderId:"H1", before:before[0],after:after[0],fields:["units","account","status"] }]);
  });
  it("does not confuse beneficial holders sharing an omnibus account", () => {
    const before=[holder("H1",1n,"OMNIBUS"),holder("H2",2n,"OMNIBUS")];
    const after=[holder("H1",1n,"OMNIBUS"),holder("H2",3n,"OMNIBUS")];
    expect(diffRegisters(before,after).changed.map((c)=>c.holderId)).toEqual(["H2"]);
  });
  it("rejects duplicate holder ids rather than silently losing lot-level data", () => {
    expect(() => diffRegisters([holder("H1",1n),holder("H1",2n)],[])).toThrow(/duplicate holder_id/);
  });
});

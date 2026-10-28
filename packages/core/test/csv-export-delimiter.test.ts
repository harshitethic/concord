import { describe, expect, it } from "vitest";
import { parseCsv, parseCsvTable, toCsv } from "../src/csv.js";
describe("configurable CSV export delimiter", () => {
  it("quotes semicolons and tabs and round-trips with a matching reader", () => {
    for (const delimiter of [";", "\t", "|"] as const) {
      const rows = [{ account: "A;B\tC|D", units: "2", note: "Alice, Smith" }];
      const output = toCsv(["account", "units", "note"], rows, { delimiter });
      expect(output).toContain(`"A;B\\tC|D"`.replace("\\t", "\t"));
      expect(parseCsv(output, { delimiter })[1]).toEqual(["A;B\tC|D", "2", "Alice, Smith"]);
      expect(parseCsvTable(output, { delimiter }).records[0]?.values.account).toBe("A;B\tC|D");
    }
  });
  it("keeps the default comma output unchanged", () => {
    expect(toCsv(["a", "b"], [{ a: "one;two", b: "3" }])).toBe("a,b\none;two,3\n");
  });
});

import { describe, expect, it } from "vitest";
import { toCsv } from "../src/csv.js";

describe("CSV writer line endings and BOM", () => {
  const header = ["id", "name"];
  const rows = [{ id: "G123", name: "Élodie" }];
  it("keeps default output byte-identical", () => {
    expect(toCsv(header, rows)).toBe("id,name\nG123,Élodie\n");
    expect(toCsv(header, rows, {})).toBe(toCsv(header, rows));
  });
  it("writes CRLF and UTF-8 BOM only when requested", () => {
    const text = toCsv(header, rows, { eol: "\r\n", bom: true });
    expect(text).toBe("\uFEFFid,name\r\nG123,Élodie\r\n");
    expect(new TextEncoder().encode(text).slice(0, 3)).toEqual(new Uint8Array([239, 187, 191]));
  });
  it("can request each option independently", () => {
    expect(toCsv(["a"], [{ a: "value" }], { bom: true })).toBe("\uFEFFa\nvalue\n");
    expect(toCsv(["a"], [], { eol: "\r\n" })).toBe("a\r\n");
  });
});

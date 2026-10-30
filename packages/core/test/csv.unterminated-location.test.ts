import { describe, expect, it } from "vitest";
import { parseCsv } from "../src/csv.js";

describe("unterminated CSV quote location", () => {
  it("reports the line where a quote opened, not the EOF line", () => {
    expect(() => parseCsv('head,units\nH0,1\nH1,"unterminated\nsecond line')).toThrow(
      "unterminated quoted field starting on line 3",
    );
  });
  it("counts CRLF and earlier multiline quoted fields correctly", () => {
    expect(() => parseCsv('header,units\r\n"a\r\nb",1\r\nH2,"bad')).toThrow(
      "unterminated quoted field starting on line 4",
    );
  });
});

import { describe, expect, it } from "vitest";
import { parseCsv } from "../src/csv.js";

describe("CSV whitespace before an opening quote", () => {
  it("preserves embedded commas in fields following a space or tab", () => {
    expect(parseCsv('a, "x,y",c\n')).toEqual([["a", "x,y", "c"]]);
    expect(parseCsv('a,\t"x,y",c\n')).toEqual([["a", "x,y", "c"]]);
  });
  it("does not treat quotes inside unquoted text as CSV delimiters", () => {
    expect(parseCsv('a,b"c,d\n')).toEqual([["a", 'b"c', "d"]]);
  });
});

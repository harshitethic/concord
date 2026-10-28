import { describe, expect, it } from "vitest";
import { parseUnits } from "../src/amount.js";

describe("opt-in scientific notation", () => {
  it("expands positive and negative exponents exactly", () => {
    expect(parseUnits("1E+3", 7, { lenient: true })).toBe(parseUnits("1000"));
    expect(parseUnits("2.5E-4", 7, { lenient: true })).toBe(parseUnits("0.00025"));
    expect(parseUnits("-3.125e+2", 7, { lenient: true })).toBe(parseUnits("-312.5"));
    expect(parseUnits("+1e2", 7, { lenient: true })).toBe(parseUnits("100"));
  });
  it("preserves strict default and never rounds off extra digits", () => {
    expect(() => parseUnits("1E+3")).toThrow(/not a decimal/);
    expect(() => parseUnits("2.5E-4", 4, { lenient: true })).toThrow(/more than 4/);
    expect(() => parseUnits("1E+99999", 7, { lenient: true })).toThrow(/exponent/);
  });
});

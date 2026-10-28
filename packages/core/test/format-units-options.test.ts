import { describe, expect, it } from "vitest";
import { formatUnits, parseUnits } from "../src/amount.js";

describe("formatUnits optional presentation", () => {
  it("does not change the default representation", () => {
    expect(formatUnits(parseUnits("1234567.5"))).toBe("1234567.5");
    expect(formatUnits(0n)).toBe("0");
  });
  it("adds grouping and a minimum fractional width", () => {
    expect(formatUnits(parseUnits("1234567.5"), 7, { group: ",", minFraction: 2 })).toBe("1,234,567.50");
    expect(formatUnits(parseUnits("-9999999.1234"), 7, { group: " ", minFraction: 3 })).toBe("-9 999 999.1234");
    expect(formatUnits(123n, 0, { group: ",", minFraction: 2 })).toBe("123.00");
  });
  it("rejects invalid width instead of filling unbounded memory", () => {
    expect(() => formatUnits(1n, 7, { minFraction: -1 })).toThrow(/minFraction/);
    expect(() => formatUnits(1n, 7, { minFraction: 101 })).toThrow(/minFraction/);
  });
});

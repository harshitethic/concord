import { describe, expect, it } from "vitest";
import { mulDiv, type Rounding } from "../src/amount.js";

describe("exact rounding modes", () => {
  it.each([
    ["floor", "1", "2", "1", 0n], ["half-up", "1", "2", "1", 1n],
    ["ceil", "1", "2", "1", 1n], ["half-even", "1", "2", "1", 0n],
    ["floor", "3", "2", "1", 1n], ["half-up", "3", "2", "1", 2n],
    ["ceil", "3", "2", "1", 2n], ["half-even", "3", "2", "1", 2n],
    ["ceil", "4", "2", "1", 2n], ["half-even", "5", "2", "1", 2n],
    ["half-even", "7", "2", "1", 4n],
  ] as const)("rounds %s of %s/%s", (mode, value, den, num, expected) => {
    expect(mulDiv(BigInt(value), BigInt(num), BigInt(den), mode as Rounding)).toBe(expected);
  });
  it("keeps existing nonnegative-only checks", () => {
    expect(() => mulDiv(-1n, 1n, 2n, "ceil")).toThrow(/non-negative/);
    expect(() => mulDiv(1n, 1n, 0n, "half-even")).toThrow(/denominator/);
  });
});

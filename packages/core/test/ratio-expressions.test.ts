import { describe, expect, it } from "vitest";
import { parseRatioExpr } from "../src/amount.js";

describe("exact ratio expressions", () => {
  it("accepts slash, colon and percent notations", () => {
    expect(parseRatioExpr("3/2")).toEqual({ num: 3n, den: 2n });
    expect(parseRatioExpr(" 2 : 1 ")).toEqual({ num: 2n, den: 1n });
    expect(parseRatioExpr("5%")).toEqual({ num: 5n, den: 100n });
    expect(parseRatioExpr("0.25%")).toEqual({ num: 25n, den: 10_000n });
  });
  it("retains decimal parsing and rejects zero or malformed divisors", () => {
    expect(parseRatioExpr("0.125")).toEqual({ num: 125n, den: 1000n });
    expect(() => parseRatioExpr("3/0")).toThrow(/denominator/);
    expect(() => parseRatioExpr("5:")).toThrow();
    expect(() => parseRatioExpr("3%%")).toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { formatAuthorizedUnits } from "./authorizedUnits";

describe("authorized units display", () => {
  it.each([
    ["1000", "1000"],
    ["1000.00", "1000"],
    ["1.20", "1.2"],
    ["0.0000000", "0"],
    ["0", "0"],
    ["10.0050", "10.005"],
    ["100.0500", "100.05"],
  ])("formats %s as %s", (input, expected) => {
    expect(formatAuthorizedUnits(input)).toBe(expected);
  });
});

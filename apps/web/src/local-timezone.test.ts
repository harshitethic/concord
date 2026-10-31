import { afterEach, describe, expect, it, vi } from "vitest";
import { localToIso } from "./ui";
afterEach(() => vi.unstubAllEnvs());

describe("datetime-local to UTC conversion", () => {
  it.each([
    ["UTC", "2026-10-06T21:00", "2026-10-06T21:00:00.000Z"],
    ["America/New_York", "2026-10-06T21:00", "2026-10-07T01:00:00.000Z"],
    ["Asia/Kolkata", "2026-10-06T21:00", "2026-10-06T15:30:00.000Z"],
    ["America/New_York", "2026-03-08T02:30", "2026-03-08T07:30:00.000Z"],
    ["America/New_York", "2026-11-01T01:30", "2026-11-01T05:30:00.000Z"],
  ])("converts %s %s correctly", (zone, value, expected) => {
    vi.stubEnv("TZ", zone);
    expect(localToIso(value)).toBe(expected);
  });
  it("rejects invalid datetime strings rather than silently uploading a shifted time", () => {
    expect(() => localToIso("not-a-date")).toThrow(RangeError);
  });
});

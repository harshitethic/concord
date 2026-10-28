import { describe, expect, it } from "vitest";
import { validateActionForm } from "./Actions";
const form = (patch: Record<string, string> = {}) => ({ type: "dividend" as const, record: "2026-10-06T10:00", until: "2026-10-06T11:00", rate: "0.05", num: "2", den: "1", payer: "", ...patch });
describe("corporate action pre-submit checks", () => {
  it("rejects invalid dividend rates, malformed payers and invalid execution windows", () => {
    expect(validateActionForm(form({ rate: "5%" })).rate).toMatch(/positive decimal/);
    expect(validateActionForm(form({ rate: "0" })).rate).toMatch(/positive decimal/);
    expect(validateActionForm(form({ rate: "0.25" })).rate).toBeUndefined();
    expect(validateActionForm(form({ payer: "bad-address" })).payer).toMatch(/Stellar/);
    expect(validateActionForm(form({ payer: "G" + "A".repeat(55) })).payer).toBeUndefined();
    expect(validateActionForm(form({ until: "2026-10-06T09:00" })).until).toMatch(/after/);
    expect(validateActionForm(form({ until: "2026-10-06T10:00" })).until).toMatch(/after/);
    expect(validateActionForm(form({ until: "" })).until).toBeUndefined();
    expect(validateActionForm(form())).toEqual({});
  });
  it("rejects zero, fractional and excessive redemption ratios", () => {
    expect(validateActionForm({ ...form(), type: "split", num: "0" }).num).toBeDefined();
    expect(validateActionForm({ ...form(), type: "split", den: "2.5" }).den).toBeDefined();
    expect(validateActionForm({ ...form(), type: "redemption", num: "2", den: "1" }).num).toMatch(/cannot exceed/);
    expect(validateActionForm({ ...form(), type: "redemption", num: "1", den: "2" })).toEqual({});
  });
});

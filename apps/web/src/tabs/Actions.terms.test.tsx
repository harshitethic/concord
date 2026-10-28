import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActionTerms } from "./Actions";
import type { Action } from "../api";
const fake = (type: Action["type"], params: Record<string, unknown>) => ({ type, params }) as Action;
describe("auditable corporate-action terms", () => {
  it("renders dividend payment terms and hides unknown keys", () => {
    render(<ActionTerms action={fake("dividend", { ratePerUnit: "0.125", payAsset: "cash-asset", rounding: "floor", payer: "G" + "A".repeat(55), windowTo: "2026-10-10T10:00:00Z", exclude: ["G" + "B".repeat(55)], internalSecret: "must-not-display" })} />);
    expect(screen.getByText("Rate per unit")).toBeInTheDocument();
    expect(screen.getByText("0.125")).toBeInTheDocument();
    expect(screen.getByText("Payment asset")).toBeInTheDocument();
    expect(screen.getByText("Paying agent")).toBeInTheDocument();
    expect(screen.getByText("Excluded addresses")).toBeInTheDocument();
    expect(screen.queryByText("must-not-display")).not.toBeInTheDocument();
    expect(screen.queryByText("Split ratio")).not.toBeInTheDocument();
  });
  it("renders split and redemption fractions without dividend fields", () => {
    const { rerender } = render(<ActionTerms action={fake("split", { num: "3", den: "2", ratePerUnit: "ignored" })} />);
    expect(screen.getByText("Split ratio")).toBeInTheDocument();
    expect(screen.getByText("3:2")).toBeInTheDocument();
    expect(screen.queryByText("Rate per unit")).not.toBeInTheDocument();
    rerender(<ActionTerms action={fake("redemption", { num: "1", den: "4" })} />);
    expect(screen.getByText("Redemption fraction")).toBeInTheDocument();
    expect(screen.getByText("1:4")).toBeInTheDocument();
  });
});
